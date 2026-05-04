/**
 * Example Usage of API Services
 * This file demonstrates how to use the API services in React components
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { financeService, ticketService, announcementService } from '@/lib/services';
import type { InitPaymentRequest, CreateTicketRequest } from '@/lib/api-types';

export default function ExampleUsage() {
  const { isAuthenticated, user, login, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  // ============================================
  // EXAMPLE 1: Login Flow
  // ============================================
  const handleLogin = async () => {
    try {
      setLoading(true);
      await login({
        email: 'user@example.com',
        password: 'password123',
      });
      console.log('Login successful!');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // EXAMPLE 2: Payment Flow
  // ============================================
  const handlePayment = async () => {
    try {
      setLoading(true);

      // Step 1: Get user's dues
      const dues = await financeService.getMyDues();
      console.log('My dues:', dues);

      // Step 2: Select dues to pay (e.g., first unpaid due)
      const unpaidDues = dues.filter(due => due.status === 'BEKLIYOR');
      if (unpaidDues.length === 0) {
        alert('No unpaid dues!');
        return;
      }

      // Step 3: Initialize payment
      const paymentRequest: InitPaymentRequest = {
        dueIds: [unpaidDues[0].id],
      };

      const paymentResponse = await financeService.initPayment(paymentRequest);
      console.log('Payment initialized:', paymentResponse);

      // Step 4: Redirect to payment gateway
      window.location.href = paymentResponse.checkoutUrl;
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // EXAMPLE 3: Create Ticket Flow
  // ============================================
  const handleCreateTicket = async () => {
    try {
      setLoading(true);

      const ticketRequest: CreateTicketRequest = {
        title: 'Water leak in apartment',
        description: 'There is a water leak in the bathroom',
        category: 'maintenance',
        priority: 'YUKSEK',
      };

      const ticket = await ticketService.createTicket(ticketRequest);
      console.log('Ticket created:', ticket);
      alert(`Ticket created successfully! ID: ${ticket.id}`);
    } catch (error) {
      console.error('Ticket creation failed:', error);
      alert('Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // EXAMPLE 4: Get Announcements
  // ============================================
  const handleGetAnnouncements = async () => {
    try {
      setLoading(true);

      const announcements = await announcementService.getAnnouncements();
      console.log('Announcements:', announcements);

      // Mark first announcement as read
      if (announcements.length > 0) {
        await announcementService.markAnnouncementAsRead(announcements[0].id);
        console.log('Announcement marked as read');
      }
    } catch (error) {
      console.error('Failed to get announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // EXAMPLE 5: Get Payment History
  // ============================================
  const handleGetPaymentHistory = async () => {
    try {
      setLoading(true);

      const payments = await financeService.getPaymentHistory();
      console.log('Payment history:', payments);

      // Display in UI
      payments.forEach(payment => {
        console.log(`Payment ${payment.id}: ${payment.amount} TL - ${payment.status}`);
      });
    } catch (error) {
      console.error('Failed to get payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Usage Examples</h1>

      {/* Authentication Status */}
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Authentication Status</h2>
        <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        {user && (
          <div className="mt-2">
            <p>User ID: {user.userId}</p>
            <p>Site ID: {user.siteId}</p>
            <p>Roles: {user.roles.join(', ')}</p>
            <p>Permissions: {user.permissions.slice(0, 5).join(', ')}...</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {!isAuthenticated ? (
          <button
            onClick={handleLogin}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        ) : (
          <>
            <button
              onClick={handlePayment}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 mr-2"
            >
              {loading ? 'Loading...' : 'Pay Dues'}
            </button>

            <button
              onClick={handleCreateTicket}
              disabled={loading}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 mr-2"
            >
              {loading ? 'Loading...' : 'Create Ticket'}
            </button>

            <button
              onClick={handleGetAnnouncements}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 mr-2"
            >
              {loading ? 'Loading...' : 'Get Announcements'}
            </button>

            <button
              onClick={handleGetPaymentHistory}
              disabled={loading}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 mr-2"
            >
              {loading ? 'Loading...' : 'Payment History'}
            </button>

            <button
              onClick={logout}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              Logout
            </button>
          </>
        )}
      </div>

      {/* Code Examples */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Code Examples</h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-bold mb-2">1. Login</h3>
            <pre className="text-sm overflow-x-auto">
{`const { login } = useAuth();

await login({
  email: 'user@example.com',
  password: 'password123'
});`}
            </pre>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-bold mb-2">2. Initialize Payment</h3>
            <pre className="text-sm overflow-x-auto">
{`import { financeService } from '@/lib/services';

const response = await financeService.initPayment({
  dueIds: ['due-uuid-1', 'due-uuid-2']
});

// Redirect to payment gateway
window.location.href = response.checkoutUrl;`}
            </pre>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-bold mb-2">3. Create Ticket</h3>
            <pre className="text-sm overflow-x-auto">
{`import { ticketService } from '@/lib/services';

const ticket = await ticketService.createTicket({
  title: 'Water leak',
  description: 'Bathroom leak',
  priority: 'YUKSEK'
});`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

