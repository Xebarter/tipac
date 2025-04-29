"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  FaTrash,
  FaEnvelopeOpen,
  FaEnvelope,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

interface Message {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt?: string;
  read: boolean;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch("/admin/api/messages");
        const data = await response.json();

        if (response.ok && data.messages) {
          const formattedMessages = data.messages.map((msg: any) => ({
            ...msg,
            _id: msg._id.toString(),
            createdAt: msg.createdAt
              ? new Date(msg.createdAt).toISOString()
              : undefined,
            read: msg.read ?? false,
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

  const handleReadToggle = async (id: string, read: boolean) => {
    try {
      const response = await fetch(`/admin/api/messages/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ read: !read }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === id ? { ...msg, read: !read } : msg
          )
        );
      } else {
        setError(data.error || "Failed to update read status");
      }
    } catch (err) {
      setError("An error occurred while updating read status.");
      console.error("Update read status error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const response = await fetch(`/admin/api/messages/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg._id !== id)
        );
      } else {
        setError(data.error || "Failed to delete message");
      }
    } catch (err) {
      setError("An error occurred while deleting the message.");
      console.error("Delete message error:", err);
    }
  };

  const toggleMessage = (id: string) => {
    setExpandedMessageId((prevId) => (prevId === id ? null : id));
  };

  if (loading)
    return (
      <div className="p-6 flex justify-center items-center h-screen">
        <span className="text-gray-500 text-lg">Loading messages...</span>
      </div>
    );

  if (error)
    return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Inbox</h1>

      {messages.length === 0 ? (
        <div className="text-center text-gray-600">No messages found.</div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`bg-white border border-gray-200 rounded-xl shadow-sm transition-transform hover:shadow-md ${
                msg.read ? "opacity-70" : ""
              }`}
            >
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2 cursor-pointer"
                onClick={() => toggleMessage(msg._id)}
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReadToggle(msg._id, msg.read);
                    }}
                    className={`rounded-full p-2 ${
                      msg.read
                        ? "bg-green-100 text-green-600"
                        : "bg-yellow-100 text-yellow-600"
                    } hover:scale-105 transition`}
                    title={msg.read ? "Mark as unread" : "Mark as read"}
                  >
                    {msg.read ? <FaEnvelopeOpen /> : <FaEnvelope />}
                  </button>

                  <div className="space-y-1">
                    <div className="font-medium text-lg text-gray-800">
                      {msg.name}
                    </div>
                    <a
                      href={`mailto:${msg.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:underline text-sm break-all"
                    >
                      {msg.email}
                    </a>
                    <div className="text-sm text-gray-600">
                      {msg.subject}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-xs text-gray-500">
                    {msg.createdAt &&
                      format(new Date(msg.createdAt), "PPpp", {
                        locale: enUS,
                      })}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(msg._id);
                    }}
                    className="text-red-500 hover:text-red-700"
                    title="Delete message"
                  >
                    <FaTrash />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMessage(msg._id);
                    }}
                    className="text-gray-500 hover:text-gray-800"
                    title="Toggle message"
                  >
                    {expandedMessageId === msg._id ? (
                      <FaChevronUp />
                    ) : (
                      <FaChevronDown />
                    )}
                  </button>
                </div>
              </div>

              {expandedMessageId === msg._id && (
                <div className="px-4 pb-4 text-gray-700 border-t border-gray-100">
                  <p className="whitespace-pre-line pt-2">{msg.message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
