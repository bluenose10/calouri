
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

interface UserStatistic {
  signup_date: string;
  signup_count: number;
}

interface AdminProps {
  className?: string;
}

const AdminDashboard: React.FC<AdminProps> = ({ className }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [statistics, setStatistics] = useState<UserStatistic[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        // Query to check if the current user has admin role
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
          console.log('Admin status:', !!data);
        }
      } catch (err) {
        console.error('Error in admin check:', err);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    // Only fetch statistics if user is admin
    if (isAdmin) {
      fetchUserStatistics();
    }
  }, [isAdmin]);

  const fetchUserStatistics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Direct query to the user statistics table - admin access is enforced by RLS
      const { data, error } = await supabase
        .from('user_statistics')
        .select('*')
        .order('signup_date', { ascending: false });
        
      if (error) {
        console.error('Error fetching user statistics:', error);
        setError(error.message);
      } else {
        console.log('Statistics data:', data);
        setStatistics(data || []);
      }
    } catch (err: any) {
      console.error('Error in fetchUserStatistics:', err);
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStatistics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the function to refresh statistics
      const { error } = await supabase.rpc('refresh_user_statistics');
      
      if (error) {
        console.error('Error refreshing statistics:', error);
        setError(error.message);
      } else {
        // Re-fetch the statistics after refresh
        fetchUserStatistics();
      }
    } catch (err: any) {
      console.error('Error refreshing statistics:', err);
      setError(err.message || 'An error occurred while refreshing data');
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading admin dashboard...</div>;
  }

  if (!isAdmin) {
    return null; // Don't show anything if not an admin
  }

  return (
    <div className={className}>
      <Card className="bg-slate-50 border-red-100">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
          <CardTitle className="flex items-center gap-2 text-red-800">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            Admin Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">User Registration Statistics</h3>
                <button 
                  onClick={refreshStatistics}
                  className="px-3 py-1 text-sm bg-slate-200 hover:bg-slate-300 rounded-md transition-colors"
                >
                  Refresh Data
                </button>
              </div>
              {statistics.length === 0 ? (
                <p className="text-gray-500 italic">No user registration data available.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">New Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statistics.map((stat, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {format(new Date(stat.signup_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {stat.signup_count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
          
          <div className="mt-6 p-3 bg-amber-50 rounded-md border border-amber-100">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Admin Information</h4>
                <p className="text-sm text-amber-700 mt-1">
                  This dashboard is only visible to administrators. You can view user registration 
                  statistics and manage user accounts.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
