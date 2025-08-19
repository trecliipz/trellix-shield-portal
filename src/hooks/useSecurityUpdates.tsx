import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SecurityUpdate {
  id: string;
  name: string;
  type: string;
  platform: string;
  version: string;
  release_date: string;
  file_size: number;
  file_name: string;
  sha256?: string;
  description?: string;
  is_recommended: boolean;
  download_url?: string;
  changelog?: string;
  created_at: string;
  updated_at: string;
  update_category?: string;
  criticality_level?: string;
  target_systems?: any;
  dependencies?: any;
  compatibility_info?: any;
  threat_coverage?: string[];
  deployment_notes?: string;
}

// Normalize update types for consistent display
export const normalizeUpdateType = (type: string, updateCategory?: string): string => {
  if (type === 'dat' || type === 'datv3' || updateCategory === 'dat') return 'DATV3';
  if (type === 'amcore_dat' || updateCategory === 'amcore') return 'AMCore';
  if (type === 'security_engine' || type === 'engine' || updateCategory === 'engine') return 'Engine';
  if (type === 'exploit_prevention' || updateCategory === 'exploit') return 'Exploit Prevention';
  if (type === 'epo_dat' || type === 'epo_policy' || updateCategory === 'epo') return 'EPO';
  if (type === 'policy_template' || updateCategory === 'policy') return 'Policy Templates';
  if (type === 'tie' || updateCategory === 'tie') return 'TIE Intelligence';
  if (type === 'content' || updateCategory === 'content') return 'Content';
  if (type === 'meddat' || updateCategory === 'meddat') return 'MEDDAT';
  if (type === 'email_dat') return 'Email DAT';
  if (type === 'gateway_dat') return 'Gateway DAT';
  return type.toUpperCase();
};

// Get filter tabs based on available update types
export const getFilterTabs = (updates: SecurityUpdate[]) => {
  const types = new Set(updates.map(update => normalizeUpdateType(update.type, update.update_category)));
  const tabs = [
    { id: 'all', label: 'All Updates', count: updates.length }
  ];
  
  Array.from(types).sort().forEach(type => {
    const count = updates.filter(update => 
      normalizeUpdateType(update.type, update.update_category) === type
    ).length;
    tabs.push({ id: type.toLowerCase().replace(/\s+/g, '_'), label: type, count });
  });
  
  return tabs;
};

// Get statistics for different update types
export const getUpdateStats = (updates: SecurityUpdate[]) => {
  const stats = {
    total: updates.length,
    critical: updates.filter(u => u.criticality_level === 'critical').length,
    recommended: updates.filter(u => u.is_recommended).length,
    recent: updates.filter(u => {
      const releaseDate = new Date(u.release_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return releaseDate > weekAgo;
    }).length
  };

  // Count by normalized types
  const typeStats: Record<string, number> = {};
  updates.forEach(update => {
    const normalizedType = normalizeUpdateType(update.type, update.update_category);
    typeStats[normalizedType] = (typeStats[normalizedType] || 0) + 1;
  });

  return { ...stats, byType: typeStats };
};

export const useSecurityUpdates = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['security-updates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_updates')
        .select('*')
        .order('release_date', { ascending: false });

      if (error) {
        console.error('Error fetching security updates:', error);
        throw error;
      }

      return data as SecurityUpdate[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const triggerUpdateFetch = async () => {
    try {
      toast({
        title: "Checking for updates...",
        description: "Fetching the latest security updates from Trellix.",
      });

      const { error } = await supabase.functions.invoke('fetch-security-updates', {
        body: { time: new Date().toISOString() }
      });

      if (error) {
        throw error;
      }

      // Invalidate and refetch the security updates
      await queryClient.invalidateQueries({ queryKey: ['security-updates'] });

      toast({
        title: "Updates refreshed",
        description: "Successfully checked for the latest security updates.",
      });
    } catch (error) {
      console.error('Error triggering update fetch:', error);
      toast({
        title: "Error",
        description: "Failed to fetch updates. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    ...query,
    triggerUpdateFetch,
    updates: query.data || [],
    stats: getUpdateStats(query.data || []),
    filterTabs: getFilterTabs(query.data || []),
  };
};