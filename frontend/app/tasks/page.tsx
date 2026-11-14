"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Filter,
  Check,
  X,
  Trash2,
  ShieldAlert,
  Droplets,
  Layers,
  Sprout,
  Calendar,
} from "lucide-react";
import {
  Farm,
  TaskItem,
  fetchFarmTasks,
  createFarmTask,
  updateTaskStatus,
  deleteTask,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function TasksPage() {
  const { farms, selectedFarm, selectFarm, token, isBackendOnline } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");

  useEffect(() => {
    if (selectedFarm && token) {
      loadTasks(selectedFarm.id, token, false);
    }
  }, [selectedFarm, token]);

  async function loadTasks(farmId: string, userToken: string, syncTelemetry: boolean = false) {
    try {
      if (syncTelemetry) setIsSyncing(true);
      const items = await fetchFarmTasks(farmId, userToken, syncTelemetry);
      setTasks(items);
    } catch (err: any) {
      setError(err.message || "Failed to load farm tasks");
    } finally {
      setIsSyncing(false);
    }
  }

  const handleSelectFarm = (farmId: string) => {
    const found = farms.find((f) => f.id === farmId);
    if (!found) return;
    selectFarm(found);
  };

  const handleStatusChange = async (taskId: string, newStatus: "pending" | "completed" | "dismissed" | "postponed") => {
    try {
      const updated = await updateTaskStatus(taskId, newStatus, token);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err: any) {
      setError(err.message || "Failed to update task status");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId, token);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err: any) {
      setError(err.message || "Failed to delete task");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !selectedFarm) return;

    try {
      const created = await createFarmTask(
        selectedFarm.id,
        {
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          category: newCategory,
          priority: newPriority,
          due_date: newDueDate || undefined,
          trigger_source: "Farmer Manual Entry",
        },
        token,
      );
      setTasks((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewCategory("general");
      setNewPriority("medium");
      setNewDueDate("");
    } catch (err: any) {
      setError(err.message || "Failed to create task");
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    return true;
  });

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const highPriorityCount = tasks.filter((t) => t.status === "pending" && t.priority === "high").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "soil":
        return <Layers className="w-4 h-4 text-amber-400" />;
      case "drainage":
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case "crop":
        return <Sprout className="w-4 h-4 text-emerald-400" />;
      case "weather":
        return <AlertTriangle className="w-4 h-4 text-blue-400" />;
      default:
        return <CalendarCheck className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Phase 8 • Action Engine</div>
          <h1 className="text-2xl font-bold text-white mt-1">Smart Farm Tasks & Reminders</h1>
          <p className="text-sm text-zinc-400">Condition-based farm suggestions and farmer-approved activity checklists.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {farms.length > 0 && (
            <select
              value={selectedFarm?.id || ""}
              onChange={(e) => handleSelectFarm(e.target.value)}
              className="flex-1 sm:flex-none bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer min-w-0"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.farm_name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => selectedFarm && loadTasks(selectedFarm.id, token, true)}
            disabled={isSyncing || !selectedFarm}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sync Telemetry</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition shadow-lg shadow-emerald-950/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 font-medium">Pending Tasks</div>
            <div className="text-2xl font-bold text-white mt-1">{pendingCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300">
            <Clock className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 font-medium">High Priority Action Required</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{highPriorityCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-800/60 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 font-medium">Completed Activities</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className="text-xs text-zinc-400 font-medium shrink-0">Status:</span>
          {["all", "pending", "completed", "dismissed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 px-3 py-1 rounded-xl text-xs font-medium capitalize transition ${
                statusFilter === s
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-xs text-zinc-400 font-medium shrink-0">Category:</span>
          {["all", "soil", "drainage", "crop", "weather"].map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`shrink-0 px-3 py-1 rounded-xl text-xs font-medium capitalize transition ${
                categoryFilter === c
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Loading farm task ledger...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-zinc-900/20 border border-zinc-800/60 text-zinc-500 text-xs space-y-2">
            <CalendarCheck className="w-8 h-8 text-zinc-600 mx-auto" />
            <div>No tasks found matching current filters.</div>
            <button
              onClick={() => {
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
              className="text-emerald-400 font-semibold hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`p-4.5 rounded-2xl border transition duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                t.status === "completed"
                  ? "bg-zinc-950/40 border-zinc-850 opacity-70"
                  : t.priority === "high"
                  ? "bg-zinc-900/60 border-amber-900/40 hover:border-amber-800/80"
                  : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                    t.status === "completed"
                      ? "bg-emerald-950/40 border-emerald-900/60 text-emerald-400"
                      : t.priority === "high"
                      ? "bg-amber-950/50 border-amber-800/60 text-amber-400"
                      : "bg-zinc-800/60 border-zinc-700 text-zinc-300"
                  }`}
                >
                  {t.status === "completed" ? (
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  ) : (
                    getCategoryIcon(t.category)
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-semibold text-sm ${
                        t.status === "completed" ? "line-through text-zinc-400" : "text-zinc-100"
                      }`}
                    >
                      {t.title}
                    </span>

                    {/* Priority badge */}
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold ${
                        t.priority === "high"
                          ? "bg-amber-950/80 text-amber-300 border border-amber-800/80"
                          : t.priority === "medium"
                          ? "bg-blue-950/80 text-blue-300 border border-blue-800/80"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {t.priority}
                    </span>

                    {/* Category badge */}
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                      {t.category}
                    </span>
                  </div>

                  {t.description && (
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
                      {t.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono pt-1">
                    <span>Source: {t.trigger_source}</span>
                    {t.due_date && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        Due: {t.due_date}
                      </span>
                    )}
                    {t.completed_at && (
                      <span className="text-emerald-400">
                        Done: {new Date(t.completed_at).toISOString().split("T")[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {t.status === "pending" ? (
                  <>
                    <button
                      onClick={() => handleStatusChange(t.id, "completed")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(t.id, "dismissed")}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition"
                      title="Dismiss reminder"
                    >
                      Dismiss
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleStatusChange(t.id, "pending")}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition"
                  >
                    Reopen
                  </button>
                )}

                <button
                  onClick={() => handleDeleteTask(t.id)}
                  className="p-1.5 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-950/30 transition"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: New Custom Farm Task */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base">Add New Farm Task</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Inspect drainage bunds along eastern terrace"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Description / Agronomic Notes</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Details regarding tools, materials, or target field blocks..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="general">General</option>
                    <option value="soil">Soil & Liming</option>
                    <option value="drainage">Drainage & Runoff</option>
                    <option value="crop">Crop Care & Sowing</option>
                    <option value="weather">Weather Preparedness</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Target Due Date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-medium hover:bg-zinc-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold transition"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
