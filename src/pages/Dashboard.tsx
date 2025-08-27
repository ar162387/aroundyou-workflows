import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LogOut, Store, ShoppingCart, Package, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import ConsumerDashboard from '@/components/ConsumerDashboard';
import MerchantDashboard from '@/components/MerchantDashboard';

interface UserProfile {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  user_type: 'consumer' | 'merchant' | 'admin';
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate('/auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setUserProfile(data);
        }
      } catch (error: any) {
        console.error('Error fetching user profile:', error);
        toast.error('Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error: any) {
      toast.error('Error signing out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-muted rounded mx-auto mb-4"></div>
            <div className="h-4 w-48 bg-muted rounded mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">AroundYou</h1>
            <Badge variant={userProfile.user_type === 'merchant' ? 'default' : 'secondary'}>
              {userProfile.user_type === 'merchant' ? 'Merchant' : 'Consumer'}
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {userProfile.first_name} {userProfile.last_name}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {userProfile.user_type === 'consumer' ? (
          <ConsumerDashboard userProfile={userProfile} />
        ) : (
          <MerchantDashboard userProfile={userProfile} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;