import React, { useState } from 'react';
import { Button, Card, Space, Typography, message } from 'antd';
import { testApiConnection, testLogin, testSocketConnection } from '@/utils/apiTest';

const { Title, Text } = Typography;

export default function ApiDebugger() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleTestApi = async () => {
    setLoading(true);
    try {
      const success = await testApiConnection();
      if (success) {
        addResult('✅ API connection successful');
        message.success('API connection successful');
      } else {
        addResult('❌ API connection failed');
        message.error('API connection failed');
      }
    } catch (error) {
      addResult(`❌ API test error: ${error}`);
      message.error('API test error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setLoading(true);
    try {
      await testLogin('testuser', 'testpass');
      addResult('✅ Login test completed');
      message.success('Login test completed');
    } catch (error) {
      addResult(`❌ Login test failed: ${error}`);
      message.error('Login test failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSocket = () => {
    testSocketConnection();
    addResult('🔌 Socket test initiated');
    message.info('Socket test initiated - check console');
  };

  const handleClearResults = () => {
    setResults([]);
  };

  return (
    <Card title="🔧 API Debugger" style={{ margin: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={5}>Environment Variables:</Title>
        <Text code>NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL || 'not set'}</Text>
        <Text code>NODE_ENV: {process.env.NODE_ENV || 'not set'}</Text>
        
        <Title level={5}>Tests:</Title>
        <Space>
          <Button 
            type="primary" 
            onClick={handleTestApi}
            loading={loading}
          >
            Test API Connection
          </Button>
          <Button 
            onClick={handleTestLogin}
            loading={loading}
          >
            Test Login
          </Button>
          <Button 
            onClick={handleTestSocket}
          >
            Test Socket
          </Button>
          <Button 
            onClick={handleClearResults}
            danger
          >
            Clear Results
          </Button>
        </Space>

        <Title level={5}>Results:</Title>
        <div style={{ 
          maxHeight: 200, 
          overflowY: 'auto', 
          border: '1px solid #d9d9d9', 
          padding: 8,
          backgroundColor: '#f5f5f5'
        }}>
          {results.length === 0 ? (
            <Text type="secondary">No test results yet...</Text>
          ) : (
            results.map((result, index) => (
              <div key={index} style={{ marginBottom: 4 }}>
                <Text>{result}</Text>
              </div>
            ))
          )}
        </div>
      </Space>
    </Card>
  );
} 