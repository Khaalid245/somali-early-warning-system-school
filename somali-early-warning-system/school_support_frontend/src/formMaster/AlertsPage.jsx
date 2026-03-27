import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Clock, CheckCircle, TrendingUp,
  Search, Filter, RefreshCw, ArrowLeft, ShieldAlert
} from 'lucide-react';
import api from '../api/apiClient';
import { showToast } from '../utils/toast';
import AlertsList from './components/AlertsList';
import AlertHistory from './components/AlertHistory';
import ReviewModal from './components/ReviewModal';

const TABS = [
  { key: 'active',  label: 'Active Alerts' },
  { key: 'history', label: 'Resolved History' },
];

const RISK_OPTIONS   = ['', 'critical', 'high', 'medium', 'low'];
const STATUS_OPTIONS = ['', 'active', 'under_review', 'escalated'];

export default function AlertsPage() {
  const navigate = useNavigate();

  const [tab, setTab]               = useState('active');
  const [alerts, setAlerts]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadingKey, setLoadingKey] = useState(null);
  const [search, setSearch]         = useState('');
  const [riskFilter, setRisk]       = useState('');
  const [statusFilter, setStatus]   = useState('');

  // ── Review modal state ─────────────────────────────────────────────────
  const [reviewAlert, setReviewAlert]       = useState(null); // alert object being reviewed
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // ── Load alerts ────────────────────────────────────────────────────────
  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/alerts/');
      setAlerts(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      showToast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  // ── Review button clicked → open modal ────────────────────────────────
  const handleReview = (alert) => setReviewAlert(alert);

  // ── Modal confirmed → PATCH alert + create InterventionCase ───────────
  const handleReviewConfirm = async ({ observation, urgency, followUp }) => {
    setReviewSubmitting(true);
    try {
      // 1. Mark alert as under_review
      await api.patch(`/alerts/${reviewAlert.alert_id}/`, { status: 'under_review' });

      // 2. Create InterventionCase with structured notes
      const casePayload = {
        student:           reviewAlert.student,
        alert:             reviewAlert.alert_id,
        status:            'in_progress',
        outcome_notes:     observation,
        escalation_reason: `Urgency: ${urgency}. Initial observation: ${observation}`,
        ...(followUp && { follow_up_date: followUp }),
      };
      const caseRes = await api.post('/interventions/', casePayload);
      const caseId  = caseRes.data?.case_id;

      showToast.success(
        caseId
          ? `Review started — Intervention Case #${caseId} created`
          : 'Review started — alert marked under review'
      );
      setReviewAlert(null);
      loadAlerts();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.student?.[0] ||
        err?.response?.data?.error ||
        'Failed to start review';
      showToast.error(msg);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ── Escalate / Resolve (no modal needed) ──────────────────────────────
  const handleAction = async (alertId, newStatus) => {
    setLoadingKey(`alert-${alertId}`);
    try {
      const res = await api.patch(`/alerts/${alertId}/`, { status: newStatus });
      if (newStatus === 'escalated' && res.data.case_created) {
        showToast.success(`Alert escalated — Intervention Case #${res.data.intervention_case_id} auto-created`);
      } else {
        showToast.success(`Alert marked as ${newStatus.replace('_', ' ')}`);
      }
      loadAlerts();
    } catch {
      showToast.error('Failed to update alert');
    } finally {
      setLoadingKey(null);
    }
  };

  // ── Client-side filter ─────────────────────────────────────────────────
  const filtered = useMemo(() => alerts.filter(a => {
    const matchSearch = !search ||
      a.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      String(a.student)?.includes(search);
    const matchRisk   = !riskFilter   || a.risk_level === riskFilter;
    const matchStatus = !statusFilter || a.status     === statusFilter;
    return matchSearch && matchRisk && matchStatus;
  }), [alerts, search, riskFilter, statusFilter]);

  // ── Summary counts ─────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    active:       alerts.filter(a => a.status === 'active').length,
    under_review: alerts.filter(a => a.status === 'under_review').length,
    escalated:    alerts.filter(a => a.status === 'escalated').length,
    critical:     alerts.filter(a => a.risk_level === 'critical').length,
  }), [alerts]);

  const SUMMARY_CARDS = [
    { label: 'Active',       value: counts.active,       icon: AlertTriangle, border: 'border-l-red-500',    icon_color: 'text-red-500',    bg: 'bg-red-50'    },
    { label: 'Under Review', value: counts.under_review, icon: Clock,         border: 'border-l-blue-500',   icon_color: 'text-blue-500',   bg: 'bg-blue-50'   },
    { label: 'Escalated',    value: counts.escalated,    icon: TrendingUp,    border: 'border-l-red-500',    icon_color: 'text-red-500',    bg: 'bg-red-50'    },
    { label: 'Critical Risk',value: counts.critical,     icon: ShieldAlert,   border: 'border-l-orange-500', icon_color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/form-master')}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Alerts
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Monitor and action student risk alerts</p>
            </div>
          </div>
          <button
            onClick={loadAlerts}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* ── Summary Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SUMMARY_CARDS.map(({ label, value, icon: Icon, border, icon_color, bg }) => (
            <div
              key={label}
              className={`bg-white rounded-lg border border-gray-200 border-l-4 ${border} p-4`}
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">{label}</span>
                <div className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${icon_color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────── */}
        <div className="flex border-b border-gray-200">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {t.key === 'active' && counts.active > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                  {counts.active}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Main Panel ────────────────────────────────────────────── */}
        <div
          className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
        >
          {tab === 'active' ? (
            <>
              {/* Search + Filter bar */}
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by student name…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <select
                      value={riskFilter}
                      onChange={e => setRisk(e.target.value)}
                      className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white appearance-none"
                    >
                      <option value="">All Risk</option>
                      {RISK_OPTIONS.filter(Boolean).map(r => (
                        <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={statusFilter}
                    onChange={e => setStatus(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="">All Status</option>
                    {STATUS_OPTIONS.filter(Boolean).map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Result count */}
              {!loading && (
                <div className="px-5 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
                  {filtered.length} alert{filtered.length !== 1 ? 's' : ''} shown
                  {(search || riskFilter || statusFilter) && ' (filtered)'}
                </div>
              )}

              {loading ? (
                <div className="p-16 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto" />
                  <p className="text-sm text-gray-500 mt-3">Loading alerts…</p>
                </div>
              ) : (
                <AlertsList
                  alerts={filtered}
                  onReview={handleReview}
                  onAlertAction={handleAction}
                  loadingKey={loadingKey}
                />
              )}
            </>
          ) : (
            <AlertHistory />
          )}
        </div>

        {/* ── Workflow guide ─────────────────────────────────────────── */}
        {tab === 'active' && !loading && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Alert Workflow
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-blue-700">
              <span><span className="font-medium">Active</span> → Review opens a structured assessment form + creates an Intervention Case</span>
              <span><span className="font-medium">Under Review</span> → Resolve if handled, or Escalate to Admin</span>
              <span><span className="font-medium">Escalated</span> → Admin has been notified, case auto-created</span>
            </div>
          </div>
        )}

      </div>

      {/* ── Review Modal ──────────────────────────────────────────────── */}
      {reviewAlert && (
        <ReviewModal
          alert={reviewAlert}
          onConfirm={handleReviewConfirm}
          onClose={() => setReviewAlert(null)}
          isSubmitting={reviewSubmitting}
        />
      )}
    </div>
  );
}
