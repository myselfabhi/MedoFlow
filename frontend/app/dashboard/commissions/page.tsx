'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { Plus, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

export default function CommissionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'rules' | 'records'>('rules');
  const [rules, setRules] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isProvider = user?.role === 'PROVIDER';

  const fetchRules = async () => {
    try {
      const res = await api.get('/commissions/rules');
      setRules(res.data.data.rules);
    } catch (error) {
      console.error('Failed to fetch commission rules', error);
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await api.get('/commissions/records');
      setRecords(res.data.data.records);
    } catch (error) {
      console.error('Failed to fetch commission records', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchRules();
      await fetchRecords();
    };
    loadData();
  }, []);

  const markAsPaid = async (recordIds: string[]) => {
    try {
      await api.post('/commissions/mark-paid', { recordIds });
      fetchRecords(); // Refresh list
    } catch (error) {
      console.error('Failed to mark as paid', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Commissions</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'rules' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Rules
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'records' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Payouts / Ledger
        </button>
      </div>

      {activeTab === 'rules' && (
        <>
          <div className="flex justify-end">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Rule
            </Button>
          </div>
          
          {isLoading ? (
            <div>Loading rules...</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rules.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{rule.provider ? `${rule.provider.firstName} ${rule.provider.lastName}` : 'All Providers'}</span>
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Applies To:</span>
                        <span className="font-medium">{rule.itemType}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium">{rule.commissionType}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Value:</span>
                        <span className="font-bold text-lg">
                          {rule.commissionType === 'PERCENTAGE' ? `${Number(rule.commissionValue)}%` : `$${Number(rule.commissionValue).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {rules.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-10">
                  No commission rules found. Add one to start automatically calculating provider splits.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'records' && (
        <>
          {!isProvider && records.some(r => r.status === 'PENDING') && (
            <div className="flex justify-end">
              <Button 
                variant="outline"
                onClick={() => markAsPaid(records.filter(r => r.status === 'PENDING').map(r => r.id))}
              >
                Mark All Pending as Paid
              </Button>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Commission Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {records.map((record) => (
                  <div key={record.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {record.provider ? `${record.provider.firstName} ${record.provider.lastName}` : 'Provider'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(record.earnedAt).toLocaleDateString()} • {record.invoiceItem?.service?.name || record.invoiceItem?.product?.name || 'Item'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        ${Number(record.amount).toFixed(2)}
                      </div>
                      <Badge variant={record.status === 'PAID' ? 'default' : 'secondary'}>
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {records.length === 0 && (
                  <div className="text-center text-muted-foreground py-10">
                    No commission records found. Completed invoices will generate commission records.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
