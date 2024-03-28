import { useState, useEffect } from "react";

type Stock = {
  symbol: string;
  company_name: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  market_cap: string;
};

function App() {
  const [stockData, setStockData] = useState<Stock[] | null>(null);

  useEffect(() => {
    // opening a connection to the server to begin receiving events from it
    const eventSource = new EventSource("/sse");

    // attaching a handler to receive message events
    eventSource.onmessage = (event) => {
      const stockData = JSON.parse(event.data);
      setStockData(stockData);
    };

    // terminating the connection on component unmount
    return () => eventSource.close();
  }, []);

  return (
    <div>
      {stockData?.map((_stock) => (
        <div key={_stock.symbol} style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 24 }}>{_stock.symbol}:</p>
          <p>price: {_stock.price}</p>
          <p>change: {_stock.change}</p>
          <p>change percent: {_stock.change_percent}%</p>
        </div>
      ))}
    </div>
  );
}

export default App;
