import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState('');
  const [results, setResults] = useState({});
  const [foodAmount, setFoodAmount] = useState('');
  const [foodPayer, setFoodPayer] = useState('');
  const [foodConsumers, setFoodConsumers] = useState([]);
  const [foodExpenses, setFoodExpenses] = useState([]);

  const baseURL = 'http://192.168.1.17:8080/api';

  useEffect(() => {
    fetchPlayers();
    fetchFoodExpenses();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await axios.get(`${baseURL}/players`);
      const playersWithDefaults = res.data.map(p => ({
        ...p,
        withdrawals: Array.isArray(p.withdrawals) ? p.withdrawals : [],
        finalAmount: p.finalAmount || 0
      }));
      setPlayers(playersWithDefaults);
    } catch (err) {
      console.error("Failed to fetch players:", err);
    }
  };

  const fetchFoodExpenses = async () => {
    try {
      const res = await axios.get(`${baseURL}/food`);
      setFoodExpenses(res.data);
    } catch (err) {
      console.error("Failed to fetch food expenses:", err);
    }
  };

  const addPlayer = async () => {
    if (!newPlayer.trim()) return;
    try {
      await axios.post(`${baseURL}/players`, { name: newPlayer });
      setNewPlayer('');
      fetchPlayers();
    } catch (err) {
      console.error("Error adding player:", err);
    }
  };

  const deletePlayer = async (id) => {
    try {
      await axios.delete(`${baseURL}/players/${id}`);
      fetchPlayers();
    } catch (err) {
      console.error("Error deleting player:", err);
    }
  };

  const addWithdrawal = async (id) => {
    try {
      await axios.post(`${baseURL}/players/${id}/withdrawals`, {
        amount: 20,
        addedBy: "admin"
      });
      fetchPlayers();
    } catch (err) {
      console.error("Error adding withdrawal:", err);
    }
  };

  const updateReturn = async (id, amount) => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) return;

    try {
      const player = players.find(p => p.id === id);
      await axios.put(`${baseURL}/players/${id}`, {
        name: player.name,
        finalAmount: parsed
      });
      fetchPlayers();
    } catch (err) {
      console.error("Error updating return amount:", err);
    }
  };

  const addFoodExpense = async () => {
    if (!foodAmount || !foodPayer || foodConsumers.length === 0) {
      alert("Please select payer, amount and consumers.");
      return;
    }

    try {
      await axios.post(`${baseURL}/food`, {
        amount: parseFloat(foodAmount),
        payer: { id: foodPayer },
        consumers: foodConsumers.map(id => ({ id }))
      });
      setFoodAmount('');
      setFoodPayer('');
      setFoodConsumers([]);
      fetchFoodExpenses();
    } catch (err) {
      console.error("Error adding food expense:", err);
      alert("Failed to add food expense.");
    }
  };

  const deleteFoodExpense = async (id) => {
    try {
      await axios.delete(`${baseURL}/food/${id}`);
      fetchFoodExpenses();
    } catch (err) {
      console.error("Error deleting food expense:", err);
      alert("Failed to delete food expense.");
    }
  };

  const calculateResults = async () => {
    try {
      const res = await axios.get(`${baseURL}/results`);
      setResults(res.data); // Always set results
    } catch (err) {
      console.error("Error calculating results:", err);
      setResults({ error: err });
    }
  };

  const getTotalWithdrawals = (withdrawals) =>
    withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;

  return (
    <div style={{ padding: '20px' }}>
      <h1>🏦 Poker Game Tracker</h1>

      {results.error && (
        <div style={{ color: 'red', fontWeight: 'bold', marginBottom: '20px' }}>
          {results.error}
        </div>
      )}

      <div style={{ marginBottom: '10px' }}>
        <input
          placeholder="Player name"
          value={newPlayer}
          onChange={e => setNewPlayer(e.target.value)}
        />
        <button onClick={addPlayer}>Add Player</button>
      </div>

      <table border="1" style={{ width: '100%', marginBottom: '10px' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Taken from Bank ($)</th>
            <th>Add to Bank</th>
            <th>Returned ($)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {players.map(player => {
            const totalWithdrawals = getTotalWithdrawals(player.withdrawals);
            return (
              <tr key={player.id}>
                <td>{player.name}</td>
                <td>{totalWithdrawals.toFixed(2)}</td>
                <td>
                  <button onClick={() => addWithdrawal(player.id)}>+20</button>
                </td>
                <td>
                  <input
                    type="number"
                    defaultValue={player.finalAmount}
                    onBlur={e => {
                      const value = parseFloat(e.target.value) || 0;
                      updateReturn(player.id, value);
                    }}
                  />
                </td>
                <td>
                  <button onClick={() => deletePlayer(player.id)}>❌ Remove</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginBottom: '20px' }}>
        <strong>Total Withdrawn:</strong> $
        {players.reduce((sum, p) => sum + getTotalWithdrawals(p.withdrawals), 0).toFixed(2)}<br />
        <strong>Total Returned:</strong> $
        {players.reduce((sum, p) => sum + (p.finalAmount || 0), 0).toFixed(2)}
      </div>

      <h2>🍔 Add Food/Drinks Expense</h2>
      <div style={{ marginBottom: '10px' }}>
        <label>Amount ($): </label>
        <input
          type="number"
          value={foodAmount}
          onChange={e => setFoodAmount(e.target.value)}
          style={{ marginRight: '10px' }}
        />
        <label>Payer: </label>
        <select value={foodPayer} onChange={e => setFoodPayer(e.target.value)}>
          <option value="">Select</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Consumers: </label>
        {players.map(p => (
          <label key={p.id} style={{ marginRight: '10px' }}>
            <input
              type="checkbox"
              value={p.id}
              checked={foodConsumers.includes(p.id)}
              onChange={e => {
                const id = e.target.value;
                setFoodConsumers(prev =>
                  prev.includes(id)
                    ? prev.filter(x => x !== id)
                    : [...prev, id]
                );
              }}
            />
            {p.name}
          </label>
        ))}
      </div>

      <button onClick={addFoodExpense} style={{ marginTop: '10px' }}>
        ➕ Add Food Expense
      </button>

      {foodExpenses.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>📋 Food Expenses</h3>
          <table border="1" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Payer</th>
                <th>Consumers</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {foodExpenses.map(fe => (
                <tr key={fe.id}>
                  <td>${fe.amount.toFixed(2)}</td>
                  <td>{fe.payer.name}</td>
                  <td>{fe.consumers.map(c => c.name).join(', ')}</td>
                  <td>
                    <button onClick={() => deleteFoodExpense(fe.id)}>❌ Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <hr />

      <button onClick={calculateResults}>🧮 Calculate Results</button>

      {results.settlements && results.settlements.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h2>💰 Final Settlements</h2>

          {results.pokerSummary && (
            <>
              <h3>🎲 Poker Net Summary</h3>
              <ul>
                {Object.entries(results.pokerSummary).map(([name, val], idx) => (
                  <li key={idx}>
                    {name}: {val > 0 ? `wins $${val.toFixed(2)}` : `loses $${(-val).toFixed(2)}`}
                  </li>
                ))}
              </ul>
            </>
          )}

          {results.foodSummary && (
            <>
              <h3>🍱 Food & Drinks Summary</h3>
              <ul>
                {Object.entries(results.foodSummary).map(([name, val], idx) => (
                  <li key={idx}>
                    {name}: {val > 0 ? `gets $${val.toFixed(2)}` : `owes $${(-val).toFixed(2)}`}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3>📢 Final Settlements</h3>
          <ul>
            {results.settlements.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
