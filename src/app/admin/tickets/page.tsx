"use client";

import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabaseClient';

interface Ticket {
  id: string;
  created_at: string;
  event_id: string;
  ticket_type_id: string | null;
  email: string;
  quantity: number;
  status: string;
  pesapal_transaction_id: string | null;
  pesapal_status: string | null;
  price: number;
  purchase_channel: string;
  batch_code: string | null;
  is_active: boolean;
  buyer_name: string | null;
  buyer_phone: string | null;
  used: boolean;
}

interface Event {
  id: string;
  title: string;
  date: string;
}

interface Batch {
  id: string;
  created_at: string;
  batch_code: string;
  event_id: string;
  num_tickets: number;
  is_active: boolean;
}

export default function AdminTicketsDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'batches' | 'used' | 'customers' | 'generate'>('tickets');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalTickets: 0,
    onlineTickets: 0,
    batchTickets: 0,
    usedTickets: 0,
    totalRevenue: 0
  });

  // Form state for batch generation
  const [batchForm, setBatchForm] = useState({
    event_id: '',
    num_tickets: 10,
    batch_code: '',
    price: 0
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Load all data
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, date')
        .order('date', { ascending: false });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);
      
      // Load tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;
      
      setTickets(ticketsData || []);
      
      // Calculate stats
      const totalTickets = ticketsData?.length || 0;
      const onlineTickets = ticketsData?.filter(t => t.purchase_channel === 'online').length || 0;
      const batchTickets = ticketsData?.filter(t => t.purchase_channel === 'physical_batch').length || 0;
      const usedTickets = ticketsData?.filter(t => t.used).length || 0;
      const totalRevenue = ticketsData?.reduce((sum, ticket) => 
        ticket.purchase_channel === 'online' && ticket.status === 'confirmed' 
          ? sum + (ticket.price * ticket.quantity) 
          : sum, 
        0
      ) || 0;
      
      setStats({
        totalTickets,
        onlineTickets,
        batchTickets,
        usedTickets,
        totalRevenue
      });
      
      // Load batches
      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (batchesError) throw batchesError;
      
      setBatches(batchesData || []);
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleBatchStatus = async (batchId: string, currentStatus: boolean) => {
    try {
      // Update batch status
      const { error: batchError } = await supabase
        .from('batches')
        .update({ is_active: !currentStatus })
        .eq('id', batchId);
      
      if (batchError) throw batchError;
      
      // Also update all tickets in this batch
      const batch = batches.find(b => b.id === batchId);
      if (batch) {
        const { error: ticketsError } = await supabase
          .from('tickets')
          .update({ is_active: !currentStatus })
          .eq('batch_code', batch.batch_code);
        
        if (ticketsError) throw ticketsError;
      }
      
      setSuccess(`Batch ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      
      // Reload data
      await loadData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const activateAllTicketsInBatch = async (batchId: string, batchCode: string) => {
    try {
      // Update all tickets in this batch to be active
      const { error: ticketsError } = await supabase
        .from('tickets')
        .update({ is_active: true })
        .eq('batch_code', batchCode);
      
      if (ticketsError) throw ticketsError;
      
      setSuccess(`All tickets in batch activated successfully!`);
      
      // Reload data
      await loadData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const handleBatchFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBatchForm(prev => ({
      ...prev,
      [name]: name === 'num_tickets' || name === 'price' ? Number(value) : value
    }));
  };

  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tickets/generate-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batchForm)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate batch tickets');
      }
      
      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets-${batchForm.batch_code}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess('Batch tickets generated successfully!');
      setBatchForm({
        event_id: '',
        num_tickets: 10,
        batch_code: '',
        price: 0
      });
      
      // Reload data to show new batch
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getEventTitle = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.title : 'Unknown Event';
  };

  const getBatchStatus = (batchCode: string | null) => {
    if (!batchCode) return 'N/A';
    const batch = batches.find(b => b.batch_code === batchCode);
    return batch ? (batch.is_active ? 'Active' : 'Inactive') : 'Not Found';
  };

  // Filter tickets based on active tab
  const filteredTickets = activeTab === 'tickets' 
    ? tickets.filter(t => !t.used)
    : activeTab === 'used'
    ? tickets.filter(t => t.used)
    : tickets;

  // Group tickets by customer for the customers tab
  const customers = tickets
    .filter(ticket => ticket.purchase_channel === 'online' && ticket.buyer_name && ticket.buyer_phone)
    .reduce((acc, ticket) => {
      const key = `${ticket.buyer_name}-${ticket.buyer_phone}`;
      if (!acc[key]) {
        acc[key] = {
          name: ticket.buyer_name,
          phone: ticket.buyer_phone,
          ticketsCount: 0,
        };
      }
      acc[key].ticketsCount += ticket.quantity;
      return acc;
    }, {} as Record<string, { name: string | null; phone: string | null; ticketsCount: number }>);

  const customersList = Object.values(customers);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tickets Dashboard</h1>
        <p className="text-gray-600 mt-1">Comprehensive overview of all tickets and batches</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Tickets</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Online Tickets</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.onlineTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-purple-100 p-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Batch Tickets</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.batchTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-yellow-100 p-3">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Used Tickets</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.usedTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Online Revenue</h3>
              <p className="text-2xl font-semibold text-gray-900">UGX {stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tickets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active Tickets
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'batches'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Ticket Batches
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'generate'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Generate Batch
          </button>
          <button
            onClick={() => setActiveTab('used')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'used'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Used Tickets
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'customers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Customers
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : activeTab === 'generate' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Generate Ticket Batch</h2>
            <p className="text-sm text-gray-500 mt-1">Create a batch of physical tickets for an event</p>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleGenerateBatch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="event_id" className="block text-sm font-medium text-gray-700">
                    Event
                  </label>
                  <select
                    id="event_id"
                    name="event_id"
                    value={batchForm.event_id}
                    onChange={handleBatchFormChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select an event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title} ({formatDate(event.date)})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="num_tickets" className="block text-sm font-medium text-gray-700">
                    Number of Tickets
                  </label>
                  <input
                    type="number"
                    id="num_tickets"
                    name="num_tickets"
                    min="1"
                    max="1000"
                    value={batchForm.num_tickets}
                    onChange={handleBatchFormChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="batch_code" className="block text-sm font-medium text-gray-700">
                    Batch Code
                  </label>
                  <input
                    type="text"
                    id="batch_code"
                    name="batch_code"
                    value={batchForm.batch_code}
                    onChange={handleBatchFormChange}
                    required
                    placeholder="Enter unique batch code"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price per Ticket (UGX)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min="0"
                    value={batchForm.price}
                    onChange={handleBatchFormChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isGenerating
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    "Generate Batch"
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">How to use:</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-blue-700">
                <li>Select the event for which you want to generate tickets</li>
                <li>Specify the number of tickets to generate (1-1000)</li>
                <li>Enter a unique batch code (used to identify this batch)</li>
                <li>Optionally set a price per ticket (0 for free tickets)</li>
                <li>Click "Generate Batch" to create the tickets and download the PDF</li>
              </ul>
            </div>
          </div>
        </div>
      ) : activeTab === 'tickets' || activeTab === 'used' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {activeTab === 'tickets' ? 'Active Tickets' : 'Used Tickets'}
            </h2>
          </div>
          
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {activeTab === 'tickets' ? 'No active tickets' : 'No used tickets'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'tickets' 
                  ? 'Tickets will appear here once they are purchased.' 
                  : 'Used tickets will appear here after verification at the event.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchaser
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Channel
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {ticket.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getEventTitle(ticket.event_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.email || ticket.buyer_name || 'N/A'}
                        {ticket.buyer_phone && (
                          <div className="text-gray-500 text-xs">{ticket.buyer_phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          ticket.purchase_channel === 'online' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {ticket.purchase_channel === 'online' ? 'Online' : 'Batch'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.price > 0 ? `UGX ${(ticket.price * ticket.quantity).toLocaleString()}` : 'Free'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mb-1 ${
                            ticket.status === "confirmed" 
                              ? "bg-green-100 text-green-800" 
                              : ticket.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {ticket.status}
                          </span>
                          {ticket.purchase_channel === 'physical_batch' && (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              ticket.is_active
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {ticket.is_active ? "Active" : "Inactive"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'customers' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Customers</h2>
            <p className="text-sm text-gray-500 mt-1">Customers who purchased tickets online</p>
          </div>
          
          {customersList.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No customers</h3>
              <p className="mt-1 text-sm text-gray-500">Customers will appear here after purchasing tickets online.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tickets Purchased
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customersList.map((customer, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-800 font-medium">
                              {customer.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-green-100 text-green-800">
                          {customer.ticketsCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // Batches tab content
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Ticket Batches</h2>
          </div>
          
          {batches.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No batches</h3>
              <p className="mt-1 text-sm text-gray-500">Batches will appear here after generating ticket batches.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch Code
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tickets Count
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {batches.map((batch) => (
                    <tr key={batch.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {batch.batch_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getEventTitle(batch.event_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {batch.num_tickets}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(batch.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          batch.is_active 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {batch.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleBatchStatus(batch.id, batch.is_active)}
                            className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                              batch.is_active
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {batch.is_active ? "Deactivate" : "Activate"}
                          </button>
                          
                          {!batch.is_active && (
                            <button
                              onClick={() => activateAllTicketsInBatch(batch.id, batch.batch_code)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Activate Tickets
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}