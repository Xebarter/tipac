"use client";

import { useEffect, useState } from "react";

type Message = {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
};

type Pagination = {
  currentPage: number;
  totalPages: number;
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ currentPage: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Fetch messages with pagination
  const fetchMessages = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/admin/api/messages?page=${page}`);
      const data = await res.json();

      // Ensure that data.messages is an array
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setPagination({
        currentPage: data.page || 1,
        totalPages: data.totalPages || 1,
      });
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setMessages([]); // Ensure it's always an array even on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(pagination.currentPage); // Fetch messages when component mounts
  }, [pagination.currentPage]);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Contact Messages</h1>

      {loading ? (
        <p>Loading...</p> // You can replace this with a spinner if you'd like
      ) : (
        <div className="space-y-4">
          {Array.isArray(messages) && messages.length > 0 ? (
            messages.map((msg) => (
              <div
                key={msg._id}
                className="border border-border p-4 rounded-md shadow-sm"
              >
                <p><strong>Name:</strong> {msg.name}</p>
                <p><strong>Email:</strong> {msg.email}</p>
                <p><strong>Subject:</strong> {msg.subject}</p>
                <p><strong>Message:</strong> {msg.message}</p>
                <p className="text-sm text-muted-foreground">
                  Sent on: {new Date(msg.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p>No messages found.</p>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-center gap-4">
        {pagination.currentPage > 1 && (
          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))
            }
            className="px-4 py-2 bg-primary text-white rounded"
          >
            Previous
          </button>
        )}

        {pagination.currentPage < pagination.totalPages && (
          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))
            }
            className="px-4 py-2 bg-primary text-white rounded"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
