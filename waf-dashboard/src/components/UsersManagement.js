import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  Search, 
  X, 
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  User
} from "lucide-react";
import API_BASE from "../config";

const ROLE_CONFIG = {
  superadmin: { icon: <ShieldAlert className="text-danger" size={12} />, color: "text-danger", bg: "bg-danger/10", border: "border-danger/20" },
  admin:      { icon: <ShieldCheck className="text-primary" size={12} />, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  viewer:     { icon: <User className="text-dim" size={12} />, color: "text-dim", bg: "bg-white/5", border: "border-white/10" }
};

export default function UsersManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // New User Form State
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("viewer");
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("waf_jwt_token");
      const res = await fetch(`${API_BASE}/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Clearance Denied");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Fetch users failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    try {
      setIsSubmitting(true);
      setError("");
      const token = localStorage.getItem("waf_jwt_token");
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Neural Sync Failed");

      setUsers(prev => [...prev, data.user]);
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (name === currentUser.username) {
      alert("Self-termination denied. Use standard logout protocols.");
      return;
    }
    if (!window.confirm(`Initiate neural purge for user: ${name}?`)) return;

    try {
      const token = localStorage.getItem("waf_jwt_token");
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Purge Failed");
      }
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setNewUsername("");
    setNewPassword("");
    setNewRole("viewer");
    setError("");
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      {/* ── Header Section ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Users size={18} className="text-primary" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Access Control Node</h2>
          </div>
          <p className="text-dim text-xs font-bold uppercase tracking-[0.2em] opacity-60">
            Managing {users.length} Authorized Neural Identities
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dim group-focus-within:text-primary transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Filter Identities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-xs font-bold text-white outline-none focus:border-primary/50 focus:bg-primary/5 transition-all w-64"
            />
          </div>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary text-black font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,242,255,0.25)]"
          >
            <UserPlus size={14} />
            New Clearance
          </button>
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="glass-panel overflow-hidden border border-white/5 relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-black text-dim uppercase tracking-[0.25em]">Identity</th>
                <th className="px-8 py-5 text-[10px] font-black text-dim uppercase tracking-[0.25em]">Role Clearance</th>
                <th className="px-8 py-5 text-[10px] font-black text-dim uppercase tracking-[0.25em]">System ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-dim uppercase tracking-[0.25em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                      <span className="text-xs font-black text-dim uppercase tracking-widest animate-pulse">Decrypting User Registry...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30 text-dim">
                      <Users size={48} strokeWidth={1} />
                      <span className="text-xs font-bold uppercase tracking-widest">No matching neural patterns found</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.map((user, idx) => (
                <motion.tr 
                  key={user._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/[0.02] group transition-colors"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${ROLE_CONFIG[user.role]?.border || "border-white/10"} ${ROLE_CONFIG[user.role]?.bg || "bg-white/5"}`}>
                        <Users size={16} className={ROLE_CONFIG[user.role]?.color || "text-dim"} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white tracking-wide">{user.username}</span>
                        {user.username === currentUser.username && (
                          <span className="text-[8px] font-black text-primary uppercase tracking-widest mt-0.5 animate-pulse">Current Active node</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${ROLE_CONFIG[user.role]?.border} ${ROLE_CONFIG[user.role]?.bg}`}>
                      {ROLE_CONFIG[user.role]?.icon}
                      <span className={`text-[9px] font-black uppercase tracking-widest ${ROLE_CONFIG[user.role]?.color}`}>
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-mono text-[10px] text-dim opacity-50 tracking-widest">
                    #{user._id?.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => handleDeleteUser(user._id, user.username)}
                      disabled={user.username === currentUser.username}
                      className={`p-2 rounded-lg transition-all ${
                        user.username === currentUser.username 
                        ? "opacity-20 cursor-not-allowed text-dim" 
                        : "text-dim hover:bg-danger/10 hover:text-danger active:scale-90"
                      }`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add User Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-panel border border-white/10 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <UserPlus size={18} className="text-primary" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Provision Identity</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-dim hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6 text-left">
                {error && (
                  <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-center gap-3 text-danger animate-shake">
                    <ShieldAlert size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-dim uppercase tracking-[0.25em] mb-2.5 ml-1">Administrator ID</label>
                  <input 
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-primary/50 focus:bg-primary/5 transition-all text-left"
                    placeholder="E.g. AGENT_SMITH"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-dim uppercase tracking-[0.25em] mb-2.5 ml-1">Neural Encryption Key</label>
                  <div className="relative">
                    <input 
                      type={showPass ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-primary/50 focus:bg-primary/5 transition-all text-left pr-12"
                      placeholder="••••••••••••"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-dim hover:text-white transition-colors"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-dim uppercase tracking-[0.25em] mb-3 ml-1">Clearance Level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.keys(ROLE_CONFIG).map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setNewRole(role)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                          newRole === role 
                          ? `${ROLE_CONFIG[role].bg} ${ROLE_CONFIG[role].border} border-white/40 shadow-[0_0_15px_rgba(0,0,0,0.2)]` 
                          : "bg-white/5 border-white/5 opacity-40 hover:opacity-100 hover:bg-white/[0.08]"
                        }`}
                      >
                        {ROLE_CONFIG[role].icon}
                        <span className={`text-[9px] font-black uppercase tracking-widest ${newRole === role ? ROLE_CONFIG[role].color : "text-white"}`}>
                          {role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-black font-black text-xs uppercase tracking-[0.25em] py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_0_20px_rgba(0,242,255,0.2)]"
                  >
                    {isSubmitting ? "Encrypting Pattern..." : "Confirm Provisioning"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
