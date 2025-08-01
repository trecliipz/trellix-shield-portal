
import React, { useState, useEffect } from 'react';
import { Brain, Zap, Target, TrendingUp, AlertCircle, CheckCircle, Clock, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface MLModel {
  id: string;
  name: string;
  model_type: string;
  version: string;
  accuracy_rate: number;
  false_positive_rate: number;
  training_status: string;
  last_updated: string;
}

interface ThreatClassification {
  id: string;
  threat_type: string;
  classification: string;
  confidence_score: number;
  classified_at: string;
}

interface MLMetric {
  id: string;
  metric_type: string;
  metric_value: number;
  timestamp: string;
}

const MLDashboard = (): JSX.Element => {
  const [mlModels, setMlModels] = useState<MLModel[]>([]);
  const [threatClassifications, setThreatClassifications] = useState<ThreatClassification[]>([]);
  const [mlMetrics, setMlMetrics] = useState<MLMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMLData();
  }, []);

  const fetchMLData = async () => {
    try {
      setLoading(true);
      
      const [modelsResponse, classificationsResponse, metricsResponse] = await Promise.all([
        supabase.from('ml_models').select('*').order('created_at', { ascending: false }),
        supabase.from('threat_classifications').select('*').order('classified_at', { ascending: false }).limit(20),
        supabase.from('ml_metrics').select('*').order('timestamp', { ascending: false }).limit(50)
      ]);

      if (modelsResponse.data) setMlModels(modelsResponse.data);
      if (classificationsResponse.data) setThreatClassifications(classificationsResponse.data);
      if (metricsResponse.data) setMlMetrics(metricsResponse.data);
    } catch (error) {
      console.error('Error fetching ML data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModelStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'training': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'deprecated': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getModelTypeIcon = (type: string) => {
    switch (type) {
      case 'behavioral_analysis': return <Brain className="h-5 w-5" />;
      case 'static_analysis': return <Database className="h-5 w-5" />;
      case 'network_traffic': return <Zap className="h-5 w-5" />;
      case 'email_security': return <Target className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  // Prepare chart data
  const accuracyData = mlModels.map(model => ({
    name: model.name.split(' ')[0],
    accuracy: Math.round(model.accuracy_rate * 100),
    falsePositives: Math.round(model.false_positive_rate * 100)
  }));

  const threatDistribution = threatClassifications.reduce((acc, threat) => {
    acc[threat.classification] = (acc[threat.classification] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(threatDistribution).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value
  }));

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3 mb-6">
        <Brain className="h-8 w-8 text-primary" />
        <h2 className="text-3xl font-bold text-primary">Machine Learning Intelligence</h2>
      </div>

      {/* ML Models Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mlModels.map((model) => (
          <Card key={model.id} className="modern-card group hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="text-primary">
                    {getModelTypeIcon(model.model_type)}
                  </div>
                  {getModelStatusIcon(model.training_status)}
                </div>
                <Badge variant={model.training_status === 'active' ? 'default' : 'secondary'}>
                  {model.training_status}
                </Badge>
              </div>
              <CardTitle className="text-lg">{model.name}</CardTitle>
              <CardDescription className="text-sm">
                {model.model_type.replace('_', ' ').toUpperCase()} • {model.version}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Accuracy</span>
                  <span className="font-semibold text-green-600">
                    {Math.round(model.accuracy_rate * 100)}%
                  </span>
                </div>
                <Progress value={model.accuracy_rate * 100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>False Positive Rate</span>
                  <span className="font-semibold text-red-600">
                    {(model.false_positive_rate * 100).toFixed(2)}%
                  </span>
                </div>
                <Progress value={model.false_positive_rate * 100} className="h-2" />
              </div>
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date(model.last_updated).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export { MLDashboard };
