'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { backendClient } from '@/lib/backend-client';
import { Server, Activity, Database, Zap, RefreshCw } from 'lucide-react';
import BackendStatus from './BackendStatus';

export default function BackendManagement() {
  const [batchPredictions, setBatchPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testBatchPrediction = async () => {
    setLoading(true);
    try {
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];
      const result = await backendClient.getBatchPredictions(symbols);
      setBatchPredictions(result);
    } catch (error) {
      console.error('Batch prediction test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Backend Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BackendStatus showDetails={true} />
          
          <div className="flex gap-2">
            <Button 
              onClick={testBatchPrediction}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Test Batch Predictions
            </Button>
          </div>

          {batchPredictions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Batch Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {batchPredictions.successful}
                    </div>
                    <div className="text-xs text-muted-foreground">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {batchPredictions.failed}
                    </div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {batchPredictions.total}
                    </div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {batchPredictions.predictions.slice(0, 5).map((pred: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="font-mono text-sm">{pred.symbol}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={pred.signal === 'BUY' ? 'default' : pred.signal === 'SELL' ? 'destructive' : 'secondary'}>
                          {pred.signal}
                        </Badge>
                        <span className="text-sm">${pred.predicted_price.toFixed(2)}</span>
                        <Badge variant="outline">{(pred.confidence * 100).toFixed(0)}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}