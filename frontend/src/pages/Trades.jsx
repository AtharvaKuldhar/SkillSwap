import { useState, useEffect } from 'react';
import { ArrowLeftRight, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   className: 'badge-pending',   icon: Clock },
  ACCEPTED:  { label: 'Accepted',  className: 'badge-accepted',  icon: CheckCircle2 },
  COMPLETED: { label: 'Completed', className: 'badge-completed', icon: CheckCircle2 },
  REJECTED:  { label: 'Rejected',  className: 'badge-rejected',  icon: XCircle },
};

function TradeCard({ trade, type, onUpdateStatus }) {
  const config = STATUS_CONFIG[trade.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = config.icon;

  const other = type === 'sent' ? trade.receiver : trade.requester;
  const otherAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || 'U')}&background=6366f1&color=fff&bold=true`;

  return (
    <div
      className="rounded-2xl p-5 transition-all"
      style={{
        background: '#1e293b',
        border: '1px solid #334155',
      }}
    >
      {/* Header row */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <img
            src={other?.avatar || otherAvatar}
            alt={other?.name}
            className="w-9 h-9 rounded-full"
            style={{ border: '2px solid rgba(99,102,241,0.3)' }}
          />
          <div>
            <p className="font-semibold text-white text-sm leading-tight">{other?.name || 'Unknown'}</p>
            <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
              {new Date(trade.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        <span className={`badge ${config.className}`}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {config.label}
        </span>
      </div>

      {/* Skill exchange */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="flex-1 rounded-xl p-3 min-w-0"
          style={{ background: '#0f172a', border: '1px solid #1e293b' }}
        >
          <p className="text-xs font-semibold mb-0.5" style={{ color: '#6366f1' }}>
            {type === 'sent' ? 'YOU OFFER' : 'THEY OFFER'}
          </p>
          <p className="font-medium text-white text-sm truncate">{trade.offeredSkill?.title}</p>
        </div>
        <div className="flex-shrink-0">
          <ArrowLeftRight className="w-4 h-4" style={{ color: '#475569' }} />
        </div>
        <div
          className="flex-1 rounded-xl p-3 min-w-0"
          style={{ background: '#0f172a', border: '1px solid #1e293b' }}
        >
          <p className="text-xs font-semibold mb-0.5" style={{ color: '#d946ef' }}>
            {type === 'sent' ? 'YOU WANT' : 'THEY WANT'}
          </p>
          <p className="font-medium text-white text-sm truncate">{trade.requestedSkill?.title}</p>
        </div>
      </div>

      {/* Actions for incoming pending trades */}
      {type === 'received' && trade.status === 'PENDING' && (
        <div className="flex gap-2">
          <button
            id={`trade-reject-${trade.id}`}
            onClick={() => onUpdateStatus(trade.id, 'REJECTED')}
            className="btn-secondary flex-1 text-sm py-2"
            style={{ color: '#f87171' }}
          >
            Decline
          </button>
          <button
            id={`trade-accept-${trade.id}`}
            onClick={() => onUpdateStatus(trade.id, 'ACCEPTED')}
            className="btn-primary flex-1 text-sm py-2"
          >
            Accept
          </button>
        </div>
      )}

      {/* Mark complete for accepted trades */}
      {trade.status === 'ACCEPTED' && (
        <button
          id={`trade-complete-${trade.id}`}
          onClick={() => onUpdateStatus(trade.id, 'COMPLETED')}
          className="w-full btn-secondary text-sm py-2"
          style={{ color: '#4ade80' }}
        >
          Mark as Completed
        </button>
      )}
    </div>
  );
}

export default function Trades() {
  const [sent, setSent]         = useState([]);
  const [received, setReceived] = useState([]);
  const [activeTab, setActiveTab] = useState('received');
  const [loading, setLoading]   = useState(true);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const data = await api.get('/trades');
      setSent(data.sent || []);
      setReceived(data.received || []);
    } catch (err) {
      console.error('Failed to fetch trades:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const handleUpdateStatus = async (tradeId, status) => {
    try {
      await api.patch(`/trades/${tradeId}/status`, { status });
      fetchTrades();
    } catch (err) {
      console.error('Failed to update trade:', err);
    }
  };

  const current = activeTab === 'sent' ? sent : received;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
            My Trades
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Manage your skill exchange requests
          </p>
        </div>
        <button
          id="trades-refresh-btn"
          onClick={fetchTrades}
          className="p-2 rounded-xl transition-all"
          style={{ color: '#64748b', border: '1px solid #334155' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#a5b4fc'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#334155'; }}
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div
        className="flex rounded-xl p-1 mb-6"
        style={{ background: '#1e293b', border: '1px solid #334155' }}
      >
        {[
          { key: 'received', label: 'Received', count: received.length },
          { key: 'sent', label: 'Sent', count: sent.length },
        ].map(tab => (
          <button
            key={tab.key}
            id={`trades-tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all"
            style={
              activeTab === tab.key
                ? {
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99,102,241,0.3)',
                  }
                : { color: '#475569', border: '1px solid transparent' }
            }
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={
                  activeTab === tab.key
                    ? { background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }
                    : { background: '#334155', color: '#64748b' }
                }
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16" style={{ color: '#475569' }}>
          <div
            className="w-8 h-8 mx-auto rounded-full border-2 border-t-transparent animate-spin mb-3"
            style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }}
          />
          Loading trades…
        </div>
      ) : current.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: '#1e293b', border: '1px solid #334155' }}
        >
          <ArrowLeftRight className="w-12 h-12 mx-auto mb-4" style={{ color: '#334155' }} />
          <p className="text-lg font-semibold text-white mb-2">No {activeTab} trades yet</p>
          <p className="text-sm" style={{ color: '#64748b' }}>
            {activeTab === 'received'
              ? 'When someone requests a trade with you, it will appear here.'
              : 'Go to the dashboard to request trades with other skill holders.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {current.map(trade => (
            <TradeCard
              key={trade.id}
              trade={trade}
              type={activeTab}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
