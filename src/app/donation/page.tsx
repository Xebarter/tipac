'use client';

import { useState } from 'react';

export default function DonationPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/pesapal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data?.url) {
        window.location.href = data.url; // Redirect to PesaPal hosted payment page
      } else {
        setError('Failed to initiate donation. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <section className="max-w-xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-bold text-center mb-6 text-primary">
        Support Our Cause
      </h1>
      <p className="text-center text-gray-600 mb-8">
        Make a donation <strong> (UGX)</strong> to help us with our work.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white shadow-lg p-6 rounded-xl border">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            name="firstName"
            required
            value={formData.firstName}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            required
            value={formData.lastName}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (UGX)
          </label>
          <input
            type="number"
            name="amount"
            required
            min={1000}
            value={formData.amount}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:ring-primary/50"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-red-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 transition"
        >
          {loading ? 'Processing Donation...' : 'Donate Now'}
        </button>
      </form>
    </section>
  );
}
