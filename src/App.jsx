import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  AlertTriangle,
  Pencil,
  X,
  Settings,
  Clock,
  Ban,
  Coffee,
  Undo2,
  Redo2,
  Save,
  History,
  RotateCcw,
  Printer,
} from "lucide-react";

function Button({ children, className = "", variant, disabled, ...props }) {
  const base =
    "px-3 py-2 text-sm rounded-xl font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = {
    default: "bg-sky-500 text-white hover:bg-sky-400 shadow-sm border border-sky-400",
    outline:
      "bg-slate-800 border border-slate-600 text-slate-100 hover:bg-slate-700 shadow-sm",
    danger: "bg-red-600 text-white hover:bg-red-500 shadow-sm border border-red-500",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm border border-emerald-500",
  };

  return (
    <button
      disabled={disabled}
      className={`${base} ${styles[variant || "default"]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-700 bg-slate-900 ${className}`}>
      {children}
    </div>
  );
}

function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

const STORAGE_KEY = "wvcs-master-scheduler-working";
const VERSIONS_KEY = "wvcs-master-scheduler-versions";

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const SEMESTERS = ["Semester 1", "Semester 2"];
const GRADE_OPTIONS = ["6", "7", "8", "9", "10", "11", "12"];

const initialPeriodTimes = {
  1: "8:15–9:00",
  2: "9:05–9:50",
  3: "9:55–10:40",
  4: "10:45–11:30",
  5: "12:05–12:50",
  6: "12:55–1:40",
  7: "1:45–2:30",
  8: "2:35–3:20",
};

const initialTeachers = [
  { id: "t1", name: "Mr. Conniry" },
  { id: "t2", name: "Mrs. Keith" },
  { id: "t3", name: "Mr. Cota" },
];

const blockTemplates = [
  {
    blockType: "prep",
    name: "Prep Period",
    color: "bg-indigo-950 border-indigo-500 text-indigo-50",
  },
  {
    blockType: "no-class",
    name: "No Class / Unavailable",
    color: "bg-slate-800 border-slate-500 text-slate-50",
  },
];

const initialClasses = [
  {
    id: "c1",
    name: "9th Grade Math",
    subject: "Math",
    grades: ["9"],
    room: "101",
    color: "bg-blue-950 border-blue-500 text-blue-50",
    checkGradeConflicts: true,
    checkRoomConflicts: true,
    notes: "",
    placements: { "Semester 1": null, "Semester 2": null },
  },
  {
    id: "c2",
    name: "9th Grade History",
    subject: "History",
    grades: ["9"],
    room: "102",
    color: "bg-amber-950 border-amber-500 text-amber-50",
    checkGradeConflicts: true,
    checkRoomConflicts: true,
    notes: "",
    placements: { "Semester 1": null, "Semester 2": null },
  },
];

const initialState = {
  teachers: initialTeachers,
  classes: initialClasses,
  scheduleBlocks: [],
  periodTimes: initialPeriodTimes,
  appSettings: {
    title: "WVCS Master Scheduler",
    subtitle: "Build next year’s schedule by teacher, period, room, and semester.",
    logoUrl: "",
  },
};

const colorOptions = [
  { label: "Blue", value: "bg-blue-950 border-blue-500 text-blue-50" },
  { label: "Green", value: "bg-emerald-950 border-emerald-500 text-emerald-50" },
  { label: "Yellow", value: "bg-amber-950 border-amber-500 text-amber-50" },
  { label: "Purple", value: "bg-purple-950 border-purple-500 text-purple-50" },
  { label: "Pink", value: "bg-pink-950 border-pink-500 text-pink-50" },
  { label: "Gray", value: "bg-slate-800 border-slate-500 text-slate-50" },
];

function getInitialWorkingState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialState;
  } catch {
    return initialState;
  }
}

function getInitialVersions() {
  try {
    const saved = localStorage.getItem(VERSIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function blankClass() {
  return {
    id: crypto.randomUUID(),
    name: "New Class",
    subject: "",
    grades: [],
    room: "",
    color: "bg-slate-800 border-slate-500 text-slate-50",
    checkGradeConflicts: true,
    checkRoomConflicts: true,
    notes: "",
    placements: { "Semester 1": null, "Semester 2": null },
  };
}

function ClassCard({ cls, conflict, onEdit, onRemove }) {
  return (
    <div
      draggable
      onDragStart={(e) =>
        e.dataTransfer.setData("dragData", JSON.stringify({ kind: "class", id: cls.id }))
      }
      className={`print-card group rounded-xl border p-2 shadow-sm cursor-grab active:cursor-grabbing ${cls.color} ${
        conflict ? "ring-2 ring-red-400" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-sm leading-tight">{cls.name}</div>
          <div className="text-xs opacity-80">{cls.subject || "No subject"}</div>
          <div className="mt-1 text-xs opacity-90">
            Grades: {cls.grades.length ? cls.grades.join(", ") : "—"}
          </div>
          <div className="mt-1 text-xs opacity-90">
            Room: {cls.room?.trim() ? cls.room : "—"}
          </div>
        </div>

        <div className="no-print flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => onEdit(cls)} className="rounded-md p-1 hover:bg-white/20">
            <Pencil size={14} />
          </button>
          <button onClick={() => onRemove(cls.id)} className="rounded-md p-1 hover:bg-white/20">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function BlockTemplateCard({ template }) {
  const Icon = template.blockType === "prep" ? Coffee : Ban;

  return (
    <div
      draggable
      onDragStart={(e) =>
        e.dataTransfer.setData(
          "dragData",
          JSON.stringify({ kind: "block-template", blockType: template.blockType })
        )
      }
      className={`rounded-xl border p-2 shadow-sm cursor-grab active:cursor-grabbing ${template.color}`}
    >
      <div className="flex items-center gap-2">
        <Icon size={16} />
        <div className="font-semibold text-sm">{template.name}</div>
      </div>
      <div className="mt-1 text-[11px] opacity-80">Reusable block</div>
    </div>
  );
}

function ScheduleBlockCard({ block, onRemove }) {
  const Icon = block.blockType === "prep" ? Coffee : Ban;

  return (
    <div className={`print-card group rounded-xl border p-2 shadow-sm ${block.color}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Icon size={15} />
            {block.name}
          </div>
          <div className="mt-1 text-xs opacity-80">Blocked schedule time</div>
        </div>
        <button
          onClick={() => onRemove(block.id)}
          className="no-print rounded-md p-1 opacity-0 group-hover:opacity-100 hover:bg-white/20"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function MasterSchoolSchedulerPrototype() {
  const [workingState, setWorkingState] = useState(getInitialWorkingState);
  const [versions, setVersions] = useState(getInitialVersions);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const [semester, setSemester] = useState("Semester 1");
  const [editingClass, setEditingClass] = useState(null);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);

  const { teachers, classes, scheduleBlocks, periodTimes, appSettings } = workingState;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workingState));
  }, [workingState]);

  useEffect(() => {
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
  }, [versions]);

  function commit(updateFn) {
    setUndoStack((prev) => [...prev, workingState]);
    setRedoStack([]);
    setWorkingState((prev) => updateFn(prev));
  }

  function undo() {
    if (!undoStack.length) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [workingState, ...prev]);
    setUndoStack((prev) => prev.slice(0, -1));
    setWorkingState(previous);
  }

  function redo() {
    if (!redoStack.length) return;
    const next = redoStack[0];
    setUndoStack((prev) => [...prev, workingState]);
    setRedoStack((prev) => prev.slice(1));
    setWorkingState(next);
  }

  function saveVersion() {
    const name = prompt("Name this schedule version:", `Draft ${versions.length + 1}`);
    if (!name) return;

    setVersions((prev) => [
      {
        id: crypto.randomUUID(),
        name,
        savedAt: new Date().toISOString(),
        data: workingState,
      },
      ...prev,
    ]);
  }

  function loadVersion(version) {
    if (!confirm(`Load "${version.name}"? Your current working schedule will be replaced.`)) return;
    commit(() => version.data);
    setVersionHistoryOpen(false);
  }

  function deleteVersion(versionId) {
    if (!confirm("Delete this saved version?")) return;
    setVersions((prev) => prev.filter((v) => v.id !== versionId));
  }

  function renameVersion(versionId) {
    const version = versions.find((v) => v.id === versionId);
    if (!version) return;
    const name = prompt("Rename version:", version.name);
    if (!name) return;
    setVersions((prev) => prev.map((v) => (v.id === versionId ? { ...v, name } : v)));
  }

  function duplicateVersion(version) {
    setVersions((prev) => [
      {
        ...version,
        id: crypto.randomUUID(),
        name: `${version.name} Copy`,
        savedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  const placedClasses = useMemo(() => {
    return classes.filter((c) => c.placements[semester]);
  }, [classes, semester]);

  const conflictMap = useMemo(() => {
    const conflicts = new Map();

    function addConflict(classId, conflict) {
      conflicts.set(classId, [...(conflicts.get(classId) || []), conflict]);
    }

    for (const period of PERIODS) {
      const inPeriod = placedClasses.filter((c) => c.placements[semester]?.period === period);

      for (let i = 0; i < inPeriod.length; i++) {
        for (let j = i + 1; j < inPeriod.length; j++) {
          const a = inPeriod[i];
          const b = inPeriod[j];

          if (a.checkGradeConflicts && b.checkGradeConflicts) {
            const overlap = a.grades.filter((g) => b.grades.includes(g));
            if (overlap.length) {
              addConflict(a.id, { type: "grade", with: b.name, grades: overlap, period });
              addConflict(b.id, { type: "grade", with: a.name, grades: overlap, period });
            }
          }

          if (a.checkRoomConflicts && b.checkRoomConflicts) {
            const roomA = a.room?.trim().toLowerCase();
            const roomB = b.room?.trim().toLowerCase();
            if (roomA && roomB && roomA === roomB) {
              addConflict(a.id, { type: "room", with: b.name, room: a.room, period });
              addConflict(b.id, { type: "room", with: a.name, room: b.room, period });
            }
          }
        }
      }
    }

    return conflicts;
  }, [placedClasses, semester]);

  const unscheduled = classes.filter((c) => !c.placements[semester]);
  const conflictList = Array.from(conflictMap.entries());

  function handleDrop(e, teacherId, period) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("dragData");
    if (!raw) return;
    const data = JSON.parse(raw);

    if (data.kind === "class") {
      placeClass(data.id, teacherId, period);
    }

    if (data.kind === "block-template") {
      addScheduleBlock(data.blockType, teacherId, period);
    }
  }

  function placeClass(classId, teacherId, period) {
    commit((state) => ({
      ...state,
      classes: state.classes.map((c) =>
        c.id === classId
          ? {
              ...c,
              placements: {
                ...c.placements,
                [semester]: { teacherId, period },
              },
            }
          : c
      ),
    }));
  }

  function unscheduleClass(classId) {
    commit((state) => ({
      ...state,
      classes: state.classes.map((c) =>
        c.id === classId ? { ...c, placements: { ...c.placements, [semester]: null } } : c
      ),
    }));
  }

  function addScheduleBlock(blockType, teacherId, period) {
    const template = blockTemplates.find((t) => t.blockType === blockType);
    if (!template) return;

    commit((state) => ({
      ...state,
      scheduleBlocks: [
        ...state.scheduleBlocks,
        {
          id: crypto.randomUUID(),
          blockType,
          name: template.name,
          color: template.color,
          semester,
          teacherId,
          period,
        },
      ],
    }));
  }

  function removeScheduleBlock(blockId) {
    commit((state) => ({
      ...state,
      scheduleBlocks: state.scheduleBlocks.filter((b) => b.id !== blockId),
    }));
  }

  function removeClass(classId) {
    commit((state) => ({
      ...state,
      classes: state.classes.filter((c) => c.id !== classId),
    }));
  }

  function saveClass(updated) {
    commit((state) => ({
      ...state,
      classes: state.classes.map((c) => (c.id === updated.id ? updated : c)),
    }));
    setEditingClass(null);
  }

  function addClass() {
    const next = blankClass();
    commit((state) => ({
      ...state,
      classes: [next, ...state.classes],
    }));
    setEditingClass(next);
  }

  function addTeacher() {
    const name = newTeacherName.trim();
    if (!name) return;
    commit((state) => ({
      ...state,
      teachers: [...state.teachers, { id: crypto.randomUUID(), name }],
    }));
    setNewTeacherName("");
  }

  function removeTeacher(teacherId) {
    commit((state) => ({
      ...state,
      teachers: state.teachers.filter((t) => t.id !== teacherId),
      classes: state.classes.map((c) => {
        const updatedPlacements = { ...c.placements };
        for (const sem of SEMESTERS) {
          if (updatedPlacements[sem]?.teacherId === teacherId) updatedPlacements[sem] = null;
        }
        return { ...c, placements: updatedPlacements };
      }),
      scheduleBlocks: state.scheduleBlocks.filter((b) => b.teacherId !== teacherId),
    }));
  }

  function updatePeriodTime(period, value) {
    commit((state) => ({
      ...state,
      periodTimes: { ...state.periodTimes, [period]: value },
    }));
  }

  function saveSettings(updated) {
    commit((state) => ({
      ...state,
      appSettings: updated,
    }));
    setSettingsOpen(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-none space-y-4">
        <div className="no-print rounded-3xl border border-slate-700 bg-slate-900/95 p-5 shadow-xl flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            {appSettings.logoUrl && (
              <img
                src={appSettings.logoUrl}
                alt="School Logo"
                className="h-24 w-24 rounded-2xl object-contain bg-white p-2 shadow-sm border border-slate-300"
              />
            )}

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">{appSettings.title}</h1>
              <p className="text-sm text-slate-400">{appSettings.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-1 rounded-xl border border-slate-700">
            {SEMESTERS.map((s) => (
              <Button key={s} variant={semester === s ? "default" : "outline"} onClick={() => setSemester(s)}>
                {s}
              </Button>
            ))}

            <Button variant="outline" onClick={undo} disabled={!undoStack.length}>
              <Undo2 size={16} className="mr-1 inline" /> Undo
            </Button>

            <Button variant="outline" onClick={redo} disabled={!redoStack.length}>
              <Redo2 size={16} className="mr-1 inline" /> Redo
            </Button>

            <Button variant="success" onClick={saveVersion}>
              <Save size={16} className="mr-1 inline" /> Save Version
            </Button>

            <Button variant="outline" onClick={() => window.print()}>
              <Printer size={16} className="mr-1 inline" /> Print
            </Button>

            <Button variant="outline" onClick={() => setVersionHistoryOpen(true)}>
              <History size={16} className="mr-1 inline" /> Versions
            </Button>

            <Button variant="outline" onClick={() => setSettingsOpen(true)}>
              <Settings size={16} className="mr-1 inline" /> Settings
            </Button>
          </div>
        </div>

        <div className="no-print">
          {conflictList.length > 0 && (
            <Card className="border-red-500 bg-red-950/60 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-2 text-red-100">
                  <AlertTriangle className="mt-0.5 text-red-300" size={18} />
                  <div>
                    <div className="font-semibold">Conflicts detected</div>
                    <div className="mt-1 space-y-1 text-sm">
                      {conflictList.map(([classId, conflicts]) => {
                        const cls = classes.find((c) => c.id === classId);
                        return conflicts.map((conflict, index) => (
                          <div key={`${classId}-${index}`}>
                            {conflict.type === "grade"
                              ? `${cls?.name} conflicts with ${conflict.with} in Period ${conflict.period} for grade(s) ${conflict.grades.join(", ")}.`
                              : `${cls?.name} conflicts with ${conflict.with} in Period ${conflict.period} because both use room ${conflict.room}.`}
                          </div>
                        ));
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[300px_1fr] print:block">
          <aside className="no-print space-y-4">
            <Card className="shadow-xl">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-white">Unscheduled Classes</h2>
                  <Button onClick={addClass}>
                    <Plus size={16} className="mr-1 inline" /> Class
                  </Button>
                </div>

                <div
                  className="min-h-28 rounded-2xl border border-dashed border-slate-600 bg-slate-950 p-3 space-y-2"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const raw = e.dataTransfer.getData("dragData");
                    if (!raw) return;
                    const data = JSON.parse(raw);
                    if (data.kind === "class") unscheduleClass(data.id);
                  }}
                >
                  {unscheduled.length ? (
                    unscheduled.map((cls) => (
                      <ClassCard
                        key={cls.id}
                        cls={cls}
                        conflict={conflictMap.has(cls.id)}
                        onEdit={setEditingClass}
                        onRemove={removeClass}
                      />
                    ))
                  ) : (
                    <div className="text-sm text-slate-500">All classes are scheduled for {semester}.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl">
              <CardContent className="p-4 space-y-3">
                <h2 className="font-semibold text-white">Reusable Blocks</h2>
                <div className="space-y-2">
                  {blockTemplates.map((template) => (
                    <BlockTemplateCard key={template.blockType} template={template} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl">
              <CardContent className="p-4 space-y-3">
                <h2 className="font-semibold text-white">Teachers</h2>
                <div className="flex gap-2">
                  <input
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTeacher()}
                    placeholder="Add teacher name"
                    className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                  />
                  <Button onClick={addTeacher}>
                    <Plus size={16} />
                  </Button>
                </div>

                <div className="space-y-2">
                  {teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    >
                      <span>{teacher.name}</span>
                      <button onClick={() => removeTeacher(teacher.id)} className="text-slate-500 hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-slate-300" />
                  <h2 className="font-semibold text-white">Period Times</h2>
                </div>

                <div className="space-y-2">
                  {PERIODS.map((period) => (
                    <label key={period} className="grid grid-cols-[80px_1fr] items-center gap-2 text-sm">
                      <span className="text-slate-300">Period {period}</span>
                      <input
                        value={periodTimes[period] || ""}
                        onChange={(e) => updatePeriodTime(period, e.target.value)}
                        placeholder="8:15–9:00"
                        className="rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-500"
                      />
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>

          <main className="screen-schedule overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-inner">
            <div
              className="grid"
              style={{
                gridTemplateColumns: `130px repeat(${teachers.length}, 240px)`,
                minWidth: `${130 + teachers.length * 240}px`,
              }}
            >
              <div className="sticky left-0 top-0 z-30 border-b border-r border-slate-700 bg-slate-800 p-3 font-semibold text-white">
                Period
              </div>

              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="sticky top-0 z-20 border-b border-r border-slate-700 bg-slate-800 p-3 font-semibold text-white"
                >
                  {teacher.name}
                </div>
              ))}

              {PERIODS.map((period) => (
                <React.Fragment key={period}>
                  <div className="sticky left-0 z-10 border-b border-r border-slate-700 bg-slate-900 p-3 font-semibold text-slate-200">
                    <div>Period {period}</div>
                    <div className="mt-1 text-xs font-normal text-slate-400">{periodTimes[period]}</div>
                  </div>

                  {teachers.map((teacher) => {
                    const classesInCell = classes.filter(
                      (c) =>
                        c.placements[semester]?.teacherId === teacher.id &&
                        c.placements[semester]?.period === period
                    );

                    const blocksInCell = scheduleBlocks.filter(
                      (b) => b.semester === semester && b.teacherId === teacher.id && b.period === period
                    );

                    return (
                      <div
                        key={`${teacher.id}-${period}`}
                        className="min-h-32 border-b border-r border-slate-800 p-2 transition hover:bg-slate-800/70"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, teacher.id, period)}
                      >
                        <div className="space-y-2">
                          {blocksInCell.map((block) => (
                            <ScheduleBlockCard key={block.id} block={block} onRemove={removeScheduleBlock} />
                          ))}

                          {classesInCell.map((cls) => (
                            <ClassCard
                              key={cls.id}
                              cls={cls}
                              conflict={conflictMap.has(cls.id)}
                              onEdit={setEditingClass}
                              onRemove={removeClass}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </main>

          <div className="print-only print-page">
            <div className="print-title">
              <h1>{appSettings.title}</h1>
              <p>
                {semester} • {appSettings.subtitle}
              </p>
            </div>

            <table className="print-table">
              <thead>
                <tr>
                  <th className="print-period">Period</th>
                  {teachers.map((teacher) => (
                    <th key={teacher.id}>{teacher.name}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {PERIODS.map((period) => (
                  <tr key={period}>
                    <td className="print-period">
                      <div>Period {period}</div>
                      <div className="print-period-time">{periodTimes[period]}</div>
                    </td>

                    {teachers.map((teacher) => {
                      const classesInCell = classes.filter(
                        (c) =>
                          c.placements[semester]?.teacherId === teacher.id &&
                          c.placements[semester]?.period === period
                      );

                      const blocksInCell = scheduleBlocks.filter(
                        (b) =>
                          b.semester === semester &&
                          b.teacherId === teacher.id &&
                          b.period === period
                      );

                      return (
                        <td key={`${teacher.id}-${period}-print`}>
                          {blocksInCell.map((block) => (
                            <div key={block.id} className="print-entry">
                              <div className="print-entry-title">{block.name}</div>
                            </div>
                          ))}

                          {classesInCell.map((cls) => (
                            <div key={cls.id} className="print-entry">
                              <div className="print-entry-title">{cls.name}</div>
                              <div className="print-entry-meta">
                                {cls.room ? `Room ${cls.room}` : ""}
                                {cls.grades?.length ? ` • Gr. ${cls.grades.join(",")}` : ""}
                              </div>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingClass && <EditClassModal cls={editingClass} onClose={() => setEditingClass(null)} onSave={saveClass} />}

      {settingsOpen && (
        <SettingsModal settings={appSettings} onClose={() => setSettingsOpen(false)} onSave={saveSettings} />
      )}

      {versionHistoryOpen && (
        <VersionHistoryModal
          versions={versions}
          onClose={() => setVersionHistoryOpen(false)}
          onLoad={loadVersion}
          onDelete={deleteVersion}
          onRename={renameVersion}
          onDuplicate={duplicateVersion}
        />
      )}
    </div>
  );
}

function EditClassModal({ cls, onClose, onSave }) {
  const [draft, setDraft] = useState(cls);

  function toggleGrade(grade) {
    setDraft((prev) => ({
      ...prev,
      grades: prev.grades.includes(grade)
        ? prev.grades.filter((g) => g !== grade)
        : [...prev.grades, grade],
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <Card className="w-full max-w-xl rounded-2xl shadow-xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Edit Class</h2>
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-slate-200">
              Class Name
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 font-normal text-slate-100"
              />
            </label>

            <label className="space-y-1 text-sm font-medium text-slate-200">
              Subject
              <input
                value={draft.subject}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 font-normal text-slate-100"
              />
            </label>
          </div>

          <label className="space-y-1 text-sm font-medium text-slate-200 block">
            Room Number / Location
            <input
              value={draft.room || ""}
              onChange={(e) => setDraft({ ...draft, room: e.target.value })}
              placeholder="Example: 101, Gym, Science Lab"
              className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 font-normal text-slate-100 placeholder:text-slate-500"
            />
          </label>

          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-200">Grades Included</div>
            <div className="flex flex-wrap gap-2">
              {GRADE_OPTIONS.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => toggleGrade(grade)}
                  className={`rounded-xl border px-3 py-1.5 text-sm ${
                    draft.grades.includes(grade)
                      ? "bg-sky-500 border-sky-400 text-white"
                      : "bg-slate-950 border-slate-600 text-slate-200"
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-slate-200">
              Color
              <select
                value={draft.color}
                onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 font-normal text-slate-100"
              >
                {colorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-2 pt-6">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <input
                  type="checkbox"
                  checked={draft.checkGradeConflicts}
                  onChange={(e) => setDraft({ ...draft, checkGradeConflicts: e.target.checked })}
                />
                Check grade conflicts
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <input
                  type="checkbox"
                  checked={draft.checkRoomConflicts}
                  onChange={(e) => setDraft({ ...draft, checkRoomConflicts: e.target.checked })}
                />
                Check room conflicts
              </label>
            </div>
          </div>

          <label className="space-y-1 text-sm font-medium text-slate-200 block">
            Notes
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              className="h-20 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 font-normal text-slate-100"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onSave(draft)}>Save Class</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsModal({ settings, onClose, onSave }) {
  const [draft, setDraft] = useState(settings);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <Card className="w-full max-w-lg rounded-2xl shadow-xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Schedule Settings</h2>
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>

          <label className="space-y-1 text-sm font-medium text-slate-200 block">
            Schedule Title
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 font-normal text-slate-100"
            />
          </label>

          <label className="space-y-1 text-sm font-medium text-slate-200 block">
            Subtext
            <input
              value={draft.subtitle}
              onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
              className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 font-normal text-slate-100"
            />
          </label>

          <label className="space-y-1 text-sm font-medium text-slate-200 block">
            Logo Path
            <input
              placeholder="/wvcs-logo.png"
              value={draft.logoUrl}
              onChange={(e) => setDraft({ ...draft, logoUrl: e.target.value })}
              className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 font-normal text-slate-100 placeholder:text-slate-500"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onSave(draft)}>Save Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VersionHistoryModal({ versions, onClose, onLoad, onDelete, onRename, onDuplicate }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <Card className="w-full max-w-3xl rounded-2xl shadow-xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Version History</h2>
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>

          {versions.length === 0 ? (
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-400">
              No saved versions yet. Click <strong>Save Version</strong> to create one.
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="rounded-xl border border-slate-700 bg-slate-950 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="font-semibold text-white">{version.name}</div>
                    <div className="text-xs text-slate-400">
                      Saved {new Date(version.savedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => onLoad(version)}>
                      <RotateCcw size={16} className="mr-1 inline" /> Load
                    </Button>
                    <Button variant="outline" onClick={() => onDuplicate(version)}>
                      Duplicate
                    </Button>
                    <Button variant="outline" onClick={() => onRename(version.id)}>
                      Rename
                    </Button>
                    <Button variant="danger" onClick={() => onDelete(version.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}