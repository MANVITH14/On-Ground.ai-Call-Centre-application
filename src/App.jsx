import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import Dashboard from './pages/Dashboard';
import PlanCalls from './pages/PlanCalls';
import PlanIncoming from './pages/PlanIncoming';
import PlanRecent from './pages/PlanRecent';
import CalendarPage from './pages/CalendarPage';
import PulsePage from './pages/PulsePage';
import PulseChannel from './pages/PulseChannel';
import LeadsModal from './components/leads/LeadsModal';
import CallDialog from './components/calling/CallDialog';
import './App.css';

export default function App() {
  const [leadsModalOpen, setLeadsModalOpen] = useState(false);
  const [leadsInitialLead, setLeadsInitialLead] = useState(null);
  const [activeCall, setActiveCall] = useState(null); // { lead, type: 'outbound'|'inbound' }

  const openLeads = (leadId = null) => {
    setLeadsInitialLead(leadId);
    setLeadsModalOpen(true);
  };

  const startCall = (lead) => {
    setActiveCall({ lead, type: 'outbound' });
  };

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <div className="app-main">
          <TopBar openLeads={openLeads} />
          <div className="app-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard openLeads={openLeads} startCall={startCall} />} />
              <Route path="/plan/calls" element={<PlanCalls startCall={startCall} />} />
              <Route path="/plan/incoming" element={<PlanIncoming />} />
              <Route path="/plan/recent" element={<PlanRecent openLeads={openLeads} />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/pulse" element={<PulsePage />} />
              <Route path="/pulse/channel/:id" element={<PulseChannel />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </div>

      {leadsModalOpen && (
        <LeadsModal
          initialLeadId={leadsInitialLead}
          onClose={() => setLeadsModalOpen(false)}
          startCall={startCall}
        />
      )}

      {activeCall && (
        <CallDialog
          call={activeCall}
          onEnd={() => setActiveCall(null)}
        />
      )}
    </BrowserRouter>
  );
}
