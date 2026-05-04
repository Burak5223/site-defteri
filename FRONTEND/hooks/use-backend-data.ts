/**
 * Custom hook for fetching data from backend
 * Falls back to mock data if backend is unavailable
 */

import { useState, useEffect } from 'react';
import { announcementService } from '@/lib/services/announcement.service';
import { financeService } from '@/lib/services/finance.service';
import { ticketService } from '@/lib/services/ticket.service';
import { 
  mockAnnouncements, 
  mockDues, 
  mockTickets,
  mockFinancialSummary,
  mockMonthlyReports 
} from '@/lib/mock-data';

export function useBackendData() {
  const [announcements, setAnnouncements] = useState(mockAnnouncements);
  const [dues, setDues] = useState(mockDues);
  const [tickets, setTickets] = useState(mockTickets);
  const [financialSummary, setFinancialSummary] = useState(mockFinancialSummary);
  const [monthlyReports, setMonthlyReports] = useState(mockMonthlyReports);
  const [isLoading, setIsLoading] = useState(true);
  const [useBackend, setUseBackend] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to fetch from backend
        const [announcementsData, duesData, ticketsData] = await Promise.all([
          announcementService.getAnnouncements().catch(() => null),
          financeService.getMyDues().catch(() => null),
          ticketService.getTickets().catch(() => null),
        ]);

        // If any data is successfully fetched, use backend
        if (announcementsData || duesData || ticketsData) {
          setUseBackend(true);
          
          if (announcementsData) {
            setAnnouncements(announcementsData.map(a => ({
              id: a.id,
              title: a.title,
              body: a.content || '',
              priority: a.priority === 'ACIL' ? 'high' : a.priority === 'YUKSEK' ? 'high' : a.priority === 'ORTA' ? 'normal' : 'low',
              createdAt: a.createdAt,
            })));
          }

          if (duesData) {
            setDues(duesData.map(d => ({
              id: d.id,
              apartmentId: d.apartmentId,
              amount: d.amount,
              currency: 'TRY',
              periodMonth: new Date().getMonth() + 1,
              periodYear: new Date().getFullYear(),
              dueDate: d.dueDate,
              status: d.status === 'ODENDI' ? 'paid' : d.status === 'GECIKMIS' ? 'overdue' : 'pending',
            })));
          }

          if (ticketsData) {
            setTickets(ticketsData.map(t => ({
              id: t.id,
              title: t.title,
              description: t.description,
              category: t.category || 'other',
              priority: t.priority.toLowerCase() as 'low' | 'medium' | 'high',
              status: t.status.toLowerCase().replace('_', '_') as 'open' | 'in_progress' | 'resolved' | 'closed',
              createdAt: t.createdAt,
              apartmentId: 'unknown',
            })));
          }
        }
      } catch (error) {
        console.log('Using mock data - backend not available');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    announcements,
    dues,
    tickets,
    financialSummary,
    monthlyReports,
    isLoading,
    useBackend,
  };
}

