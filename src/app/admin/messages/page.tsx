"use client";

import { useEffect, useState } from "react";

interface Message {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt?: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch("/admin/api/messages");
        const data = await response.json();

        if (response.ok && data.messages) {
          // Convert MongoDB _id to string and ensure createdAt is a string
          const formattedMessages = data.messages.map((msg: any) => ({
            ...msg,
            _id: msg._id.toString(),
            createdAt: msg.createdAt ? new Date(msg.createdAt).toISOString() : undefined,
          }));
          setMessages(formattedMessages);
        } else {
          setError(data.error || "Failed to load messages");
        }
      } catch (err) {
        setError("An error occurred while fetching messages.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  if (loading) return <div className="p-4">Loading messages...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Received Messages</h1>
      {messages.length === 0 ? (
        <p>No messages found.</p>
      ) : (
        <ul className="space-y-6">
          {messages.map((msg) => (
            <li key={msg._id} className="border p-4 rounded-lg shadow-sm bg-white">
              <p><strong>Name:</strong> {msg.name}</p>
              <p><strong>Email:</strong> {msg.email}</p>
              <p><strong>Subject:</strong> {msg.subject}</p>
              <p><strong>Message:</strong></p>
              <p className="whitespace-pre-wrap">{msg.message}</p>
              {msg.createdAt && (
                <p className="text-sm text-gray-500 mt-2">
                  Received at: {new Date(msg.createdAt).toLocaleString()}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}