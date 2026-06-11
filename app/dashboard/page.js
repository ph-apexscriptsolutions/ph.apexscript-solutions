"use client";
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardPage;
var react_1 = require("react");
var navigation_1 = require("next/navigation");
var client_1 = require("@/utils/supabase/client");
var lucide_react_1 = require("lucide-react");
var flag_icon_1 = require("@/components/flag-icon");
var Card = function (_a) {
    var children = _a.children, className = _a.className;
    return <div className={"rounded-xl border border-zinc-200 bg-white shadow-md ".concat(className)}>{children}</div>;
};
var CardHeader = function (_a) {
    var children = _a.children, className = _a.className;
    return <div className={"flex flex-col space-y-1.5 p-6 ".concat(className)}>{children}</div>;
};
var CardTitle = function (_a) {
    var children = _a.children, className = _a.className;
    return <h3 className={"font-semibold leading-none tracking-tight ".concat(className)}>{children}</h3>;
};
var CardContent = function (_a) {
    var children = _a.children, className = _a.className;
    return <div className={"p-6 pt-0 ".concat(className)}>{children}</div>;
};
var formatKB = function (sizeStr) {
    if (!sizeStr)
        return "0.0 KB";
    var match = sizeStr.toString().match(/([\d.]+)/);
    return match ? "".concat(parseFloat(match[1]).toFixed(1), " KB") : sizeStr;
};
var calculateTotalKB = function (records) {
    var total = 0;
    records.forEach(function (r) {
        var match = (r.byte_size || "0").toString().match(/([\d.]+)/);
        if (match)
            total += parseFloat(match[1]);
    });
    return "".concat(total.toFixed(1), " KB");
};
var getDisplayFileName = function (fileName) {
    return fileName.replace(/\.txt$/i, '');
};
var getCurrencyConfig = function (location) {
    switch (location) {
        case 'United States':
            return { locale: 'en-US', currency: 'USD' };
        case 'Canada':
            return { locale: 'en-CA', currency: 'CAD' };
        case 'Philippines':
            return { locale: 'en-PH', currency: 'PHP' };
        case 'India':
            return { locale: 'en-IN', currency: 'INR' };
        case 'United Kingdom':
            return { locale: 'en-GB', currency: 'GBP' };
        case 'Australia':
            return { locale: 'en-AU', currency: 'AUD' };
        default:
            return { locale: 'en-US', currency: 'USD' };
    }
};
var formatCurrency = function (amount, location) {
    var config = getCurrencyConfig(location);
    return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};
var normalizeFileName = function (fileName) {
    return fileName.trim().toLowerCase().replace(/\.txt$/i, '');
};
var hasDuplicateFileName = function (fileName, records) {
    var normalized = normalizeFileName(fileName);
    return records.some(function (r) { return normalizeFileName(r.file_name || '') === normalized; });
};
var formatDate = function (date) {
    if (!date)
        return 'N/A';
    var parsed = new Date(date);
    if (Number.isNaN(parsed.getTime()))
        return 'N/A';
    return parsed.toLocaleDateString();
};
var ROLE_BADGE_STYLES = {
    admin: 'bg-cyan-100 text-cyan-800',
    moderator: 'bg-amber-100 text-amber-800',
    worker: 'bg-zinc-100 text-zinc-700',
    default: 'bg-zinc-100 text-zinc-700',
};
var formatRoleLabel = function (role) {
    return role
        .replace(/_/g, ' ')
        .replace(/\b\w/g, function (match) { return match.toUpperCase(); });
};
var COUNTRY_FLAGS = {
    'Australia': '🇦🇺',
    'Canada': '🇨🇦',
    'India': '🇮🇳',
    'Philippines': '🇵🇭',
    'United Kingdom': '🇬🇧',
    'United States': '🇺🇸',
};
function DashboardPage() {
    var _this = this;
    var router = (0, navigation_1.useRouter)();
    var _a = (0, react_1.useState)(null), user = _a[0], setUser = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    var _c = (0, react_1.useState)(null), profile = _c[0], setProfile = _c[1];
    var _d = (0, react_1.useState)([]), allWorkers = _d[0], setAllWorkers = _d[1];
    var _e = (0, react_1.useState)(null), activeWorker = _e[0], setActiveWorker = _e[1];
    var _f = (0, react_1.useState)('list'), view = _f[0], setView = _f[1];
    var _g = (0, react_1.useState)(false), filterApplied = _g[0], setFilterApplied = _g[1];
    var _h = (0, react_1.useState)(0), filterTrigger = _h[0], setFilterTrigger = _h[1];
    var _j = (0, react_1.useState)(""), startDate = _j[0], setStartDate = _j[1];
    var _k = (0, react_1.useState)(""), endDate = _k[0], setEndDate = _k[1];
    var _l = (0, react_1.useState)([]), records = _l[0], setRecords = _l[1];
    var _m = (0, react_1.useState)(null), selectedFile = _m[0], setSelectedFile = _m[1];
    var _o = (0, react_1.useState)(false), isUploadModalOpen = _o[0], setIsUploadModalOpen = _o[1];
    var _p = (0, react_1.useState)(false), isUploading = _p[0], setIsUploading = _p[1];
    var _q = (0, react_1.useState)(false), isManualAddModalOpen = _q[0], setIsManualAddModalOpen = _q[1];
    var _r = (0, react_1.useState)({ fileName: "", dateCompleted: "", byteSize: "" }), manualFileForm = _r[0], setManualFileForm = _r[1];
    var _s = (0, react_1.useState)(null), editingRecord = _s[0], setEditingRecord = _s[1];
    var _t = (0, react_1.useState)(false), isEditModalOpen = _t[0], setIsEditModalOpen = _t[1];
    var _u = (0, react_1.useState)({ file_name: "", date_completed: "", byte_size: "" }), editForm = _u[0], setEditForm = _u[1];
    var _v = (0, react_1.useState)(false), isSaving = _v[0], setIsSaving = _v[1];
    var _w = (0, react_1.useState)(null), computedEarnings = _w[0], setComputedEarnings = _w[1];
    var _x = (0, react_1.useState)(false), isAddingManualRecord = _x[0], setIsAddingManualRecord = _x[1];
    var _y = (0, react_1.useState)(false), isBankModalOpen = _y[0], setIsBankModalOpen = _y[1];
    var _z = (0, react_1.useState)({ bankName: "", accountNumber: "", accountType: "", routingNumber: "" }), bankForm = _z[0], setBankForm = _z[1];
    var _0 = (0, react_1.useState)(false), isUpdatingBank = _0[0], setIsUpdatingBank = _0[1];
    var _1 = (0, react_1.useState)(false), isPaymentModalOpen = _1[0], setIsPaymentModalOpen = _1[1];
    var _2 = (0, react_1.useState)(null), selectedPaymentRate = _2[0], setSelectedPaymentRate = _2[1];
    var _3 = (0, react_1.useState)(false), isUpdatingPayment = _3[0], setIsUpdatingPayment = _3[1];
    var _4 = (0, react_1.useState)(false), isPayslipModalOpen = _4[0], setIsPayslipModalOpen = _4[1];
    var _5 = (0, react_1.useState)(""), payslipCutoffStart = _5[0], setPayslipCutoffStart = _5[1];
    var _6 = (0, react_1.useState)(""), payslipCutoffEnd = _6[0], setPayslipCutoffEnd = _6[1];
    var _7 = (0, react_1.useState)(false), isRequestingPayslip = _7[0], setIsRequestingPayslip = _7[1];
    var _8 = (0, react_1.useState)([]), payslipRequests = _8[0], setPayslipRequests = _8[1];
    var _9 = (0, react_1.useState)(false), isPayslipAdminModalOpen = _9[0], setIsPayslipAdminModalOpen = _9[1];
    var _10 = (0, react_1.useState)([]), adminPayslipRequests = _10[0], setAdminPayslipRequests = _10[1];
    var _11 = (0, react_1.useState)(null), loadingWorkerId = _11[0], setLoadingWorkerId = _11[1];
    var _12 = (0, react_1.useState)(false), isProcessingRequest = _12[0], setIsProcessingRequest = _12[1];
    var _13 = (0, react_1.useState)(false), isAddWorkerModalOpen = _13[0], setIsAddWorkerModalOpen = _13[1];
    var _14 = (0, react_1.useState)({ fullName: "", jobTitle: "", department: "", email: "", password: "", role: "worker", location: "United States" }), newWorkerForm = _14[0], setNewWorkerForm = _14[1];
    var _15 = (0, react_1.useState)(false), isAddingWorker = _15[0], setIsAddingWorker = _15[1];
    var _16 = (0, react_1.useState)(null), toastMessage = _16[0], setToastMessage = _16[1];
    var _17 = (0, react_1.useState)(false), showToast = _17[0], setShowToast = _17[1];
    var _18 = (0, react_1.useState)(false), isEditWorkerModalOpen = _18[0], setIsEditWorkerModalOpen = _18[1];
    var _19 = (0, react_1.useState)({ fullName: "", jobTitle: "", department: "", email: "", location: "United States" }), editWorkerForm = _19[0], setEditWorkerForm = _19[1];
    var _20 = (0, react_1.useState)(false), isUpdatingWorkerDetails = _20[0], setIsUpdatingWorkerDetails = _20[1];
    var _21 = (0, react_1.useState)([]), assignments = _21[0], setAssignments = _21[1];
    var _22 = (0, react_1.useState)(false), isAddAssignmentModalOpen = _22[0], setIsAddAssignmentModalOpen = _22[1];
    var _23 = (0, react_1.useState)(""), newAssignmentFilename = _23[0], setNewAssignmentFilename = _23[1];
    var _24 = (0, react_1.useState)(false), isAddingAssignment = _24[0], setIsAddingAssignment = _24[1];
    var _25 = (0, react_1.useState)(null), selectedAssignment = _25[0], setSelectedAssignment = _25[1];
    (0, react_1.useEffect)(function () {
        client_1.supabase.auth.getUser().then(function (_a) {
            var data = _a.data;
            if (!data.user) {
                router.push("/");
                return;
            }
            setUser(data.user);
        });
    }, [router]);
    (0, react_1.useEffect)(function () {
        if (!user)
            return;
        var fetch = function () { return __awaiter(_this, void 0, void 0, function () {
            var myProfile, workers;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, client_1.supabase.from("worker_profiles").select("*").eq("id", user.id).single()];
                    case 1:
                        myProfile = (_a.sent()).data;
                        if (myProfile)
                            setProfile(myProfile);
                        if (!((myProfile === null || myProfile === void 0 ? void 0 : myProfile.role) === "admin")) return [3 /*break*/, 3];
                        return [4 /*yield*/, client_1.supabase.from("worker_profiles").select("*").order("full_name")];
                    case 2:
                        workers = (_a.sent()).data;
                        if (workers)
                            setAllWorkers(workers);
                        _a.label = 3;
                    case 3:
                        setLoading(false);
                        return [2 /*return*/];
                }
            });
        }); };
        fetch();
    }, [user]);
    (0, react_1.useEffect)(function () {
        if (!activeWorker)
            return;
        if (!filterApplied) {
            setRecords([]);
            return;
        }
        var fetch = function () { return __awaiter(_this, void 0, void 0, function () {
            var q, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        q = client_1.supabase.from("production_records").select("*").eq("worker_id", activeWorker.id);
                        if (startDate)
                            q = q.gte("date_completed", startDate);
                        if (endDate)
                            q = q.lte("date_completed", endDate);
                        return [4 /*yield*/, q.order("date_completed", { ascending: false })];
                    case 1:
                        data = (_a.sent()).data;
                        if (data)
                            setRecords(data);
                        return [2 /*return*/];
                }
            });
        }); };
        fetch();
    }, [activeWorker, filterTrigger]);
    (0, react_1.useEffect)(function () {
        if (!activeWorker)
            return;
        setBankForm({
            bankName: activeWorker.bank_name || "",
            accountNumber: activeWorker.account_number || "",
            accountType: activeWorker.account_type || "",
            routingNumber: activeWorker.routing_number || "",
        });
        // Force refresh worker data to pick up any newly added columns
        var refreshWorker = function () { return __awaiter(_this, void 0, void 0, function () {
            var refreshed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, client_1.supabase.from("worker_profiles").select("*").eq("id", activeWorker.id).single()];
                    case 1:
                        refreshed = (_a.sent()).data;
                        if (refreshed) {
                            setActiveWorker(refreshed);
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        refreshWorker();
    }, [activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.id]);
    (0, react_1.useEffect)(function () {
        if (!(activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.id))
            return;
        fetchWorkerPayslipRequests(activeWorker.id);
        fetchAssignments(activeWorker.id);
    }, [activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.id]);
    (0, react_1.useEffect)(function () {
        if (profile && !activeWorker && profile.role !== "admin") {
            setActiveWorker(profile);
            setView("detail");
        }
    }, [profile, activeWorker]);
    var handleLogout = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, client_1.supabase.auth.signOut()];
            case 1:
                _a.sent();
                router.push("/");
                return [2 /*return*/];
        }
    }); }); };
    var handleViewWorker = function (w) { setActiveWorker(w); setView("detail"); };
    var handleBackToList = function () { setActiveWorker(null); setRecords([]); setView("list"); setStartDate(""); setEndDate(""); setFilterApplied(false); setFilterTrigger(function (prev) { return prev + 1; }); };
    var clearFilters = function () { setStartDate(""); setEndDate(""); setFilterApplied(false); setFilterTrigger(function (prev) { return prev + 1; }); };
    var applyFilters = function () {
        if (!startDate || !endDate) {
            alert('Please select both start and end dates before filtering.');
            return;
        }
        setFilterApplied(true);
        setFilterTrigger(function (prev) { return prev + 1; });
    };
    var openEditModal = function (r) {
        setEditingRecord(r);
        setEditForm({
            date_completed: r.date_completed,
            file_name: getDisplayFileName(r.file_name),
            byte_size: r.byte_size || "",
        });
        setIsEditModalOpen(true);
    };
    var handleDeleteRecord = function (recordId) { return __awaiter(_this, void 0, void 0, function () {
        var response, result, q, data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm('Are you sure you want to delete this record?'))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch('/api/delete-production-record', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ recordId: recordId }),
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    if (!response.ok) {
                        throw new Error(result.error || 'Failed to delete record.');
                    }
                    q = client_1.supabase.from('production_records').select('*').eq('worker_id', activeWorker.id);
                    if (startDate)
                        q = q.gte('date_completed', startDate);
                    if (endDate)
                        q = q.lte('date_completed', endDate);
                    return [4 /*yield*/, q.order('date_completed', { ascending: false })];
                case 4:
                    data = (_a.sent()).data;
                    if (data)
                        setRecords(data);
                    alert('✅ Record deleted successfully!');
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    console.error('Delete error:', err_1);
                    alert("Failed to delete: ".concat(err_1.message));
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleDeleteWorker = function (workerId, workerName) { return __awaiter(_this, void 0, void 0, function () {
        var response, result, workers, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (workerId === (user === null || user === void 0 ? void 0 : user.id)) {
                        alert('You cannot delete your own account while logged in.');
                        return [2 /*return*/];
                    }
                    if (!confirm("Are you sure you want to delete ".concat(workerName, "? This cannot be undone.")))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch('/api/delete-worker', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ workerId: workerId }),
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    if (!response.ok) {
                        throw new Error(result.error || 'Failed to delete worker.');
                    }
                    return [4 /*yield*/, client_1.supabase.from('worker_profiles').select('*').order('full_name')];
                case 4:
                    workers = (_a.sent()).data;
                    if (workers)
                        setAllWorkers(workers);
                    setActiveWorker(null);
                    setView('list');
                    setRecords([]);
                    alert('✅ Worker deleted successfully!');
                    return [3 /*break*/, 6];
                case 5:
                    err_2 = _a.sent();
                    console.error('Delete worker error:', err_2);
                    alert("Failed to delete worker: ".concat(err_2.message));
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var saveEdit = function () { return __awaiter(_this, void 0, void 0, function () {
        var fileNameToSave, q, data;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!editingRecord)
                        return [2 /*return*/];
                    setIsSaving(true);
                    fileNameToSave = ((_a = editingRecord.file_name) === null || _a === void 0 ? void 0 : _a.toLowerCase().endsWith('.txt')) && !editForm.file_name.toLowerCase().endsWith('.txt')
                        ? "".concat(editForm.file_name, ".txt")
                        : editForm.file_name;
                    return [4 /*yield*/, client_1.supabase.from("production_records").update({ date_completed: editForm.date_completed, file_name: fileNameToSave, byte_size: editForm.byte_size }).eq("id", editingRecord.id)];
                case 1:
                    _b.sent();
                    setIsEditModalOpen(false);
                    q = client_1.supabase.from("production_records").select("*").eq("worker_id", activeWorker.id);
                    if (startDate)
                        q = q.gte("date_completed", startDate);
                    if (endDate)
                        q = q.lte("date_completed", endDate);
                    return [4 /*yield*/, q.order("date_completed", { ascending: false })];
                case 2:
                    data = (_b.sent()).data;
                    if (data)
                        setRecords(data);
                    setIsSaving(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleFileUpload = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var sizeToSave, formData, uploadUrl, uploadRes, uploadText, uploadData, matchingAssignment, updateRes, err_3, newRecords, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!selectedFile || !activeWorker)
                        return [2 /*return*/];
                    if (!selectedFile.name.toLowerCase().endsWith('.txt')) {
                        alert("Only .txt files are allowed.");
                        return [2 /*return*/];
                    }
                    if (hasDuplicateFileName(selectedFile.name, records)) {
                        alert('A file with the same name already exists. Please rename the file before uploading.');
                        return [2 /*return*/];
                    }
                    setIsUploading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 11, 12, 13]);
                    sizeToSave = "".concat(Math.max(0, (selectedFile.size / 1024) - 2.1).toFixed(1), " KB");
                    formData = new FormData();
                    formData.append('file', selectedFile);
                    formData.append('workerId', activeWorker.id);
                    formData.append('workerName', activeWorker.full_name);
                    formData.append('fileName', selectedFile.name);
                    formData.append('byteSize', sizeToSave);
                    uploadUrl = new URL('/api/send-file', window.location.origin).toString();
                    return [4 /*yield*/, fetch(uploadUrl, { method: 'POST', body: formData })];
                case 2:
                    uploadRes = _a.sent();
                    return [4 /*yield*/, uploadRes.text()];
                case 3:
                    uploadText = _a.sent();
                    uploadData = null;
                    try {
                        uploadData = uploadText ? JSON.parse(uploadText) : null;
                    }
                    catch (jsonErr) {
                        throw new Error("Upload failed: invalid JSON response (".concat(uploadRes.status, " ").concat(uploadRes.statusText, ") \u2014 ").concat(uploadText));
                    }
                    if (!uploadRes.ok) {
                        throw new Error((uploadData === null || uploadData === void 0 ? void 0 : uploadData.error) || "Upload failed (".concat(uploadRes.status, " ").concat(uploadRes.statusText, ") \u2014 ").concat(uploadText));
                    }
                    matchingAssignment = assignments.find(function (a) { return normalizeFileName(a.filename || '') === normalizeFileName(selectedFile.name) && a.status === 'pending'; });
                    if (!matchingAssignment) return [3 /*break*/, 9];
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 8, , 9]);
                    return [4 /*yield*/, fetch('/api/production-assignments/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ assignmentId: matchingAssignment.id, status: 'done' }),
                        })];
                case 5:
                    updateRes = _a.sent();
                    if (!updateRes.ok) return [3 /*break*/, 7];
                    return [4 /*yield*/, fetchAssignments(activeWorker.id)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [3 /*break*/, 9];
                case 8:
                    err_3 = _a.sent();
                    console.error('Failed to update assignment status:', err_3);
                    return [3 /*break*/, 9];
                case 9:
                    setIsUploadModalOpen(false);
                    setSelectedFile(null);
                    return [4 /*yield*/, client_1.supabase.from("production_records").select("*").eq("worker_id", activeWorker.id).order("date_completed", { ascending: false }).limit(1)];
                case 10:
                    newRecords = (_a.sent()).data;
                    if (newRecords && newRecords.length > 0) {
                        setRecords([newRecords[0]]);
                    }
                    alert("✅ File uploaded, saved, and emailed successfully!");
                    return [3 /*break*/, 13];
                case 11:
                    err_4 = _a.sent();
                    console.error(err_4);
                    alert("Upload Failed: ".concat(err_4.message));
                    return [3 /*break*/, 13];
                case 12:
                    setIsUploading(false);
                    return [7 /*endfinally*/];
                case 13: return [2 /*return*/];
            }
        });
    }); };
    var handleAddManualRecord = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var response, result, q, data, err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!activeWorker)
                        return [2 /*return*/];
                    if (!manualFileForm.fileName || !manualFileForm.dateCompleted || !manualFileForm.byteSize) {
                        alert('Please complete all fields to add a manual record.');
                        return [2 /*return*/];
                    }
                    if (hasDuplicateFileName(manualFileForm.fileName, records)) {
                        alert('A record with the same file name already exists. Please choose a different file name.');
                        return [2 /*return*/];
                    }
                    setIsAddingManualRecord(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, fetch('/api/add-production-record', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                workerId: activeWorker.id,
                                fileName: manualFileForm.fileName,
                                dateCompleted: manualFileForm.dateCompleted,
                                byteSize: manualFileForm.byteSize,
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    if (!response.ok)
                        throw new Error(result.error || 'Failed to add manual record.');
                    setIsManualAddModalOpen(false);
                    setManualFileForm({ fileName: '', dateCompleted: '', byteSize: '' });
                    q = client_1.supabase.from('production_records').select('*').eq('worker_id', activeWorker.id);
                    if (startDate)
                        q = q.gte('date_completed', startDate);
                    if (endDate)
                        q = q.lte('date_completed', endDate);
                    return [4 /*yield*/, q.order('date_completed', { ascending: false })];
                case 4:
                    data = (_a.sent()).data;
                    if (data)
                        setRecords(data);
                    alert('✅ Manual record added successfully!');
                    return [3 /*break*/, 7];
                case 5:
                    err_5 = _a.sent();
                    console.error('Manual add error:', err_5);
                    alert("Failed to add record: ".concat(err_5.message));
                    return [3 /*break*/, 7];
                case 6:
                    setIsAddingManualRecord(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var handleSaveBankDetails = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var response, errorData, updatedWorker, admin, workers, err_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!activeWorker)
                        return [2 /*return*/];
                    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountType || !bankForm.routingNumber) {
                        alert('Please fill in all bank details before saving.');
                        return [2 /*return*/];
                    }
                    setIsUpdatingBank(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, 10, 11]);
                    return [4 /*yield*/, fetch('/api/update-bank-details', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                workerId: activeWorker.id,
                                bankDetails: bankForm,
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    errorData = _a.sent();
                    throw new Error(errorData.error || 'Failed to update bank details');
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    updatedWorker = (_a.sent()).data;
                    if (!updatedWorker) return [3 /*break*/, 8];
                    setActiveWorker(updatedWorker);
                    admin = (profile === null || profile === void 0 ? void 0 : profile.role) === 'admin';
                    if (!admin) return [3 /*break*/, 7];
                    return [4 /*yield*/, client_1.supabase.from('worker_profiles').select('*').order('full_name')];
                case 6:
                    workers = (_a.sent()).data;
                    if (workers)
                        setAllWorkers(workers);
                    _a.label = 7;
                case 7:
                    setToastMessage('✅ Bank details updated successfully!');
                    setShowToast(true);
                    setTimeout(function () { setShowToast(false); setToastMessage(null); }, 3000);
                    _a.label = 8;
                case 8:
                    setIsBankModalOpen(false);
                    return [3 /*break*/, 11];
                case 9:
                    err_6 = _a.sent();
                    console.error('Bank details update error:', err_6);
                    alert("Failed to update bank details: ".concat(err_6.message));
                    return [3 /*break*/, 11];
                case 10:
                    setIsUpdatingBank(false);
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    }); };
    var handleSavePaymentRate = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, errorData, updatedWorker, admin, workers, err_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!activeWorker || selectedPaymentRate === null)
                        return [2 /*return*/];
                    setIsUpdatingPayment(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, 10, 11]);
                    return [4 /*yield*/, fetch('/api/update-worker-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                workerId: activeWorker.id,
                                basePaymentPer60kb: selectedPaymentRate,
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    errorData = _a.sent();
                    throw new Error(errorData.error || 'Failed to update payment rate');
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    updatedWorker = (_a.sent()).data;
                    if (!updatedWorker) return [3 /*break*/, 8];
                    setActiveWorker(updatedWorker);
                    admin = (profile === null || profile === void 0 ? void 0 : profile.role) === 'admin';
                    if (!admin) return [3 /*break*/, 7];
                    return [4 /*yield*/, client_1.supabase.from('worker_profiles').select('*').order('full_name')];
                case 6:
                    workers = (_a.sent()).data;
                    if (workers)
                        setAllWorkers(workers);
                    _a.label = 7;
                case 7:
                    setToastMessage("\u2705 Payment rate updated to ".concat(formatCurrency(selectedPaymentRate, activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.location), " per 60KB!"));
                    setShowToast(true);
                    setTimeout(function () { setShowToast(false); setToastMessage(null); }, 3000);
                    _a.label = 8;
                case 8:
                    setIsPaymentModalOpen(false);
                    setSelectedPaymentRate(null);
                    return [3 /*break*/, 11];
                case 9:
                    err_7 = _a.sent();
                    console.error('Payment update error:', err_7);
                    alert("Failed to update payment rate: ".concat(err_7.message));
                    return [3 /*break*/, 11];
                case 10:
                    setIsUpdatingPayment(false);
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    }); };
    var openEditWorkerModal = function () {
        if (!activeWorker)
            return;
        setEditWorkerForm({
            fullName: activeWorker.full_name || "",
            jobTitle: activeWorker.job_title || "",
            department: activeWorker.department || "",
            email: activeWorker.email || "",
            location: activeWorker.location || "United States",
        });
        setIsEditWorkerModalOpen(true);
    };
    var handleSaveWorkerDetails = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var response, errorData, updatedWorker, workers, err_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!activeWorker)
                        return [2 /*return*/];
                    if (!editWorkerForm.fullName || !editWorkerForm.jobTitle || !editWorkerForm.department || !editWorkerForm.email || !editWorkerForm.location) {
                        alert('Please fill in all required fields.');
                        return [2 /*return*/];
                    }
                    setIsUpdatingWorkerDetails(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, 9, 10]);
                    return [4 /*yield*/, fetch('/api/edit-worker-details', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                workerId: activeWorker.id,
                                workerDetails: {
                                    fullName: editWorkerForm.fullName,
                                    jobTitle: editWorkerForm.jobTitle,
                                    department: editWorkerForm.department,
                                    email: editWorkerForm.email,
                                    location: editWorkerForm.location,
                                },
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    errorData = _a.sent();
                    throw new Error(errorData.error || 'Failed to update worker details');
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    updatedWorker = (_a.sent()).data;
                    if (!updatedWorker) return [3 /*break*/, 7];
                    setActiveWorker(updatedWorker);
                    return [4 /*yield*/, client_1.supabase.from('worker_profiles').select('*').order('full_name')];
                case 6:
                    workers = (_a.sent()).data;
                    if (workers)
                        setAllWorkers(workers);
                    setToastMessage('✅ Worker details updated successfully!');
                    setShowToast(true);
                    setTimeout(function () { setShowToast(false); setToastMessage(null); }, 3000);
                    _a.label = 7;
                case 7:
                    setIsEditWorkerModalOpen(false);
                    return [3 /*break*/, 10];
                case 8:
                    err_8 = _a.sent();
                    console.error('Worker details update error:', err_8);
                    alert("Failed to update worker details: ".concat(err_8.message));
                    return [3 /*break*/, 10];
                case 9:
                    setIsUpdatingWorkerDetails(false);
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    }); };
    var handleAddWorker = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var response, result, workers, err_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setIsAddingWorker(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, fetch('/api/add-worker', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: newWorkerForm.email,
                                password: newWorkerForm.password,
                                fullName: newWorkerForm.fullName,
                                jobTitle: newWorkerForm.jobTitle,
                                department: newWorkerForm.department,
                                role: newWorkerForm.role,
                                location: newWorkerForm.location,
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    if (!response.ok) {
                        throw new Error(result.error || 'Unable to add worker.');
                    }
                    alert('✅ Worker added successfully!');
                    setIsAddWorkerModalOpen(false);
                    setNewWorkerForm({ fullName: '', jobTitle: '', department: '', email: '', password: '', role: 'worker', location: 'United States' });
                    return [4 /*yield*/, client_1.supabase.from('worker_profiles').select('*').order('full_name')];
                case 4:
                    workers = (_a.sent()).data;
                    if (workers)
                        setAllWorkers(workers);
                    return [3 /*break*/, 7];
                case 5:
                    err_9 = _a.sent();
                    console.error('Failed to add worker:', err_9);
                    alert("Failed to add worker: ".concat(err_9.message));
                    return [3 /*break*/, 7];
                case 6:
                    setIsAddingWorker(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    // loading check moved below so all hooks run consistently
    var isAdmin = (profile === null || profile === void 0 ? void 0 : profile.role) === "admin";
    var hasBankColumns = !!activeWorker && (Object.prototype.hasOwnProperty.call(activeWorker, 'bank_name') ||
        Object.prototype.hasOwnProperty.call(activeWorker, 'account_number') ||
        Object.prototype.hasOwnProperty.call(activeWorker, 'account_type') ||
        Object.prototype.hasOwnProperty.call(activeWorker, 'routing_number'));
    var canEditBank = hasBankColumns && (isAdmin || (activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.id) === (user === null || user === void 0 ? void 0 : user.id));
    var canEditProfile = isAdmin || (activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.id) === (user === null || user === void 0 ? void 0 : user.id);
    var filteredTotalFiles = records.length;
    var filteredTotalKB = calculateTotalKB(records);
    var computeTotalEarnings = function () {
        var kbValue = parseFloat(filteredTotalKB.replace(/[^\d.]/g, '')) || 0;
        var basePayment = (activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.base_payment_per_60kb) || 700;
        var earnings = (kbValue / 60) * basePayment;
        setComputedEarnings(formatCurrency(earnings, activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.location));
    };
    var requestPayslip = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, data, err_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!activeWorker)
                        return [2 /*return*/];
                    if (!payslipCutoffStart || !payslipCutoffEnd) {
                        alert('Please choose a cutoff start and end date for the payslip.');
                        return [2 /*return*/];
                    }
                    setIsRequestingPayslip(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, fetch('/api/request-payslip', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                workerId: activeWorker.id,
                                cutoffStart: payslipCutoffStart,
                                cutoffEnd: payslipCutoffEnd,
                            }),
                        })];
                case 2:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    if (!res.ok)
                        throw new Error(data.error || 'Failed to request payslip');
                    setIsPayslipModalOpen(false);
                    setPayslipCutoffStart('');
                    setPayslipCutoffEnd('');
                    return [4 /*yield*/, fetchWorkerPayslipRequests(activeWorker.id)];
                case 4:
                    _a.sent();
                    setToastMessage('✅ Payslip request submitted');
                    setShowToast(true);
                    setTimeout(function () { setShowToast(false); setToastMessage(null); }, 3000);
                    return [3 /*break*/, 7];
                case 5:
                    err_10 = _a.sent();
                    console.error('Payslip request error:', err_10);
                    alert("Failed to request payslip: ".concat(err_10.message));
                    return [3 /*break*/, 7];
                case 6:
                    setIsRequestingPayslip(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var fetchPayslipRequests = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, data, requests, missingIds, err_11;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, fetch('/api/payslip-requests')];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    if (!res.ok)
                        throw new Error(data.error || 'Failed to fetch payslip requests');
                    setAdminPayslipRequests(data.requests || []);
                    requests = data.requests || [];
                    missingIds = Array.from(new Set(requests.filter(function (r) { return !r.worker_name && r.worker_id; }).map(function (r) { return String(r.worker_id); })));
                    if (!(missingIds.length > 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, Promise.all(missingIds.map(function (id) { return __awaiter(_this, void 0, void 0, function () {
                            var res2, d2, profile_1, e_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 3, , 4]);
                                        return [4 /*yield*/, fetch("/api/worker-profiles?id=".concat(encodeURIComponent(id)))];
                                    case 1:
                                        res2 = _a.sent();
                                        return [4 /*yield*/, res2.json()];
                                    case 2:
                                        d2 = _a.sent();
                                        if (res2.ok && d2.profile) {
                                            profile_1 = d2.profile;
                                            setAdminPayslipRequests(function (prev) { return prev.map(function (r) { return r.worker_id === id ? __assign(__assign({}, r), { worker_name: profile_1.full_name || null, worker_email: profile_1.email || null }) : r; }); });
                                        }
                                        return [3 /*break*/, 4];
                                    case 3:
                                        e_1 = _a.sent();
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_11 = _a.sent();
                    console.error('Fetch payslip requests error:', err_11);
                    alert("Failed to load payslip requests: ".concat(err_11.message));
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var fetchWorkerPayslipRequests = function (workerId) { return __awaiter(_this, void 0, void 0, function () {
        var res, data, err_12;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/payslip-requests?workerId=".concat(encodeURIComponent(workerId)))];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    if (!res.ok)
                        throw new Error(data.error || 'Failed to fetch payslip requests');
                    setPayslipRequests(data.requests || []);
                    return [3 /*break*/, 4];
                case 3:
                    err_12 = _a.sent();
                    console.error('Fetch worker payslip requests error:', err_12);
                    setPayslipRequests([]);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var uploadPayslipFile = function (requestId, file) { return __awaiter(_this, void 0, void 0, function () {
        var formData, res, data_1, err_13;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!file)
                        return [2 /*return*/];
                    formData = new FormData();
                    formData.append('requestId', String(requestId));
                    formData.append('file', file);
                    setIsProcessingRequest(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, 9, 10]);
                    return [4 /*yield*/, fetch('/api/payslip-requests/upload', {
                            method: 'POST',
                            body: formData,
                        })];
                case 2:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    data_1 = _a.sent();
                    if (!res.ok || !data_1.success)
                        throw new Error(data_1.error || 'Failed to upload payslip');
                    if (!(data_1.warning && data_1.payslipUrl)) return [3 /*break*/, 4];
                    setAdminPayslipRequests(function (prev) { return prev.map(function (r) { return r.id === requestId ? __assign(__assign({}, r), { payslip_url: data_1.payslipUrl }) : r; }); });
                    return [3 /*break*/, 7];
                case 4: return [4 /*yield*/, fetchPayslipRequests()];
                case 5:
                    _a.sent();
                    if (!(activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.id)) return [3 /*break*/, 7];
                    return [4 /*yield*/, fetchWorkerPayslipRequests(activeWorker.id)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7:
                    setToastMessage(data_1.warning ? "\u2705 Uploaded, but could not save URL: ".concat(data_1.warning) : '✅ Payslip uploaded successfully');
                    setShowToast(true);
                    setTimeout(function () { setShowToast(false); setToastMessage(null); }, 4000);
                    return [3 /*break*/, 10];
                case 8:
                    err_13 = _a.sent();
                    console.error('Payslip upload error:', err_13);
                    alert("Failed to upload payslip: ".concat(err_13.message));
                    return [3 /*break*/, 10];
                case 9:
                    setIsProcessingRequest(false);
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    }); };
    var loadWorkerInfo = function (workerId, requestId) { return __awaiter(_this, void 0, void 0, function () {
        var res, data, profile_2, err_14;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    setLoadingWorkerId(requestId + '');
                    return [4 /*yield*/, fetch("/api/worker-profiles?id=".concat(encodeURIComponent(workerId)))];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    if (!res.ok || !data.profile)
                        throw new Error(data.error || 'Failed');
                    profile_2 = data.profile;
                    setAdminPayslipRequests(function (prev) { return prev.map(function (r) { return r.id === requestId ? __assign(__assign({}, r), { worker_name: profile_2.full_name || null, worker_email: profile_2.email || null }) : r; }); });
                    return [3 /*break*/, 5];
                case 3:
                    err_14 = _a.sent();
                    console.error('Load worker info error:', err_14);
                    alert('Failed to load worker info');
                    return [3 /*break*/, 5];
                case 4:
                    setLoadingWorkerId(null);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var updatePayslipRequestStatus = function (id, status) { return __awaiter(_this, void 0, void 0, function () {
        var res, data, err_15;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsProcessingRequest(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, 8, 9]);
                    return [4 /*yield*/, fetch('/api/payslip-requests/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ requestId: id, status: status }),
                        })];
                case 2:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    if (!res.ok)
                        throw new Error(data.error || 'Failed to update request');
                    // refresh list
                    return [4 /*yield*/, fetchPayslipRequests()];
                case 4:
                    // refresh list
                    _a.sent();
                    if (!(activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.id)) return [3 /*break*/, 6];
                    return [4 /*yield*/, fetchWorkerPayslipRequests(activeWorker.id)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    setToastMessage('✅ Payslip request updated');
                    setShowToast(true);
                    setTimeout(function () { setShowToast(false); setToastMessage(null); }, 3000);
                    return [3 /*break*/, 9];
                case 7:
                    err_15 = _a.sent();
                    console.error('Update payslip request error:', err_15);
                    alert("Failed to update payslip request: ".concat(err_15.message));
                    return [3 /*break*/, 9];
                case 8:
                    setIsProcessingRequest(false);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var deletePayslipRequest = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var res, data, err_16;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm('Are you sure you want to delete this payslip request? This action cannot be undone.'))
                        return [2 /*return*/];
                    setIsProcessingRequest(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, 8, 9]);
                    return [4 /*yield*/, fetch('/api/payslip-requests/delete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ requestId: id }),
                        })];
                case 2:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    if (!res.ok)
                        throw new Error(data.error || 'Failed to delete request');
                    // refresh list
                    return [4 /*yield*/, fetchPayslipRequests()];
                case 4:
                    // refresh list
                    _a.sent();
                    if (!(activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.id)) return [3 /*break*/, 6];
                    return [4 /*yield*/, fetchWorkerPayslipRequests(activeWorker.id)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    setToastMessage('✅ Payslip request deleted');
                    setShowToast(true);
                    setTimeout(function () { setShowToast(false); setToastMessage(null); }, 3000);
                    return [3 /*break*/, 9];
                case 7:
                    err_16 = _a.sent();
                    console.error('Delete payslip request error:', err_16);
                    alert("Failed to delete payslip request: ".concat(err_16.message));
                    return [3 /*break*/, 9];
                case 8:
                    setIsProcessingRequest(false);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var fetchAssignments = function (workerId) { return __awaiter(_this, void 0, void 0, function () {
        var res, data, err_17;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/production-assignments?workerId=".concat(encodeURIComponent(workerId)))];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    if (!res.ok)
                        throw new Error(data.error || 'Failed to fetch assignments');
                    setAssignments(data.assignments || []);
                    return [3 /*break*/, 4];
                case 3:
                    err_17 = _a.sent();
                    console.error('Fetch assignments error:', err_17);
                    setAssignments([]);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var addAssignment = function (workerId, filename) { return __awaiter(_this, void 0, void 0, function () {
        var requestUrl, res, data, jsonErr_1, err_18;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!filename.trim()) {
                        alert('Please enter a filename');
                        return [2 /*return*/];
                    }
                    setIsAddingAssignment(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, 9, 10]);
                    requestUrl = new URL('/api/production-assignments', window.location.origin).toString();
                    return [4 /*yield*/, fetch(requestUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ workerId: workerId, filename: filename.trim() }),
                        })];
                case 2:
                    res = _a.sent();
                    data = null;
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, res.json()];
                case 4:
                    data = _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    jsonErr_1 = _a.sent();
                    throw new Error("API response was not valid JSON (".concat(res.status, " ").concat(res.statusText, ")"));
                case 6:
                    if (!res.ok)
                        throw new Error((data === null || data === void 0 ? void 0 : data.error) || "Failed to add assignment (".concat(res.status, ")"));
                    return [4 /*yield*/, fetchAssignments(workerId)];
                case 7:
                    _a.sent();
                    setNewAssignmentFilename("");
                    setIsAddAssignmentModalOpen(false);
                    setToastMessage('✅ Assignment added');
                    setShowToast(true);
                    setTimeout(function () { setShowToast(false); setToastMessage(null); }, 3000);
                    return [3 /*break*/, 10];
                case 8:
                    err_18 = _a.sent();
                    console.error('Add assignment error:', err_18);
                    alert("Failed to add assignment: ".concat(err_18.message));
                    return [3 /*break*/, 10];
                case 9:
                    setIsAddingAssignment(false);
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    }); };
    var deleteAssignment = function (assignmentId) { return __awaiter(_this, void 0, void 0, function () {
        var res, data, err_19;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm('Are you sure you want to delete this assignment?'))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetch('/api/production-assignments/delete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ assignmentId: assignmentId }),
                        })];
                case 2:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    if (!res.ok)
                        throw new Error(data.error || 'Failed to delete assignment');
                    if (!(activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.id)) return [3 /*break*/, 5];
                    return [4 /*yield*/, fetchAssignments(activeWorker.id)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    setToastMessage('✅ Assignment deleted');
                    setShowToast(true);
                    setTimeout(function () { setShowToast(false); setToastMessage(null); }, 3000);
                    return [3 /*break*/, 7];
                case 6:
                    err_19 = _a.sent();
                    console.error('Delete assignment error:', err_19);
                    alert("Failed to delete assignment: ".concat(err_19.message));
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    if (loading && !user)
        return <div className="flex min-h-screen items-center justify-center bg-zinc-50"><p className="text-zinc-500">Loading...</p></div>;
    return (<div className="min-h-screen bg-zinc-50">
      {showToast && toastMessage && (<div className="fixed right-6 bottom-6 z-50 max-w-xs rounded-lg bg-slate-900 px-4 py-3 text-white shadow-lg">
          <div className="text-sm font-medium">{toastMessage}</div>
        </div>)}
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          {isAdmin && view === "detail" && <button onClick={handleBackToList} className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"><lucide_react_1.ArrowLeft className="h-4 w-4"/> Back to Team</button>}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-cyan-600 to-sky-500 text-white shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12a9 9 0 1118 0 9 9 0 01-18 0z"/></svg>
            </div>
            <div>
              <div className="text-lg font-semibold text-zinc-900">ApexScript Solutions</div>
              <div className="text-xs text-zinc-400">{isAdmin ? 'Admin Dashboard' : 'Worker Dashboard'}</div>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-red-600 to-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/20 hover:from-red-700 hover:to-rose-600 transition"><lucide_react_1.LogOut className="h-4 w-4"/> Log Out</button>
      </header>

      <main className="mx-auto max-w-6xl p-6 space-y-6">
        {isAdmin && view === "list" ? (<div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-900">Team Members</h2>
                <p className="text-zinc-500">Select a worker to view their production records and information.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={function () { return setIsAddWorkerModalOpen(true); }} className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-slate-900 via-zinc-900 to-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:from-slate-700 hover:via-zinc-800 hover:to-stone-800 transition">
                  <lucide_react_1.UserPlus className="h-4 w-4"/> Add New Worker
                </button>
                {isAdmin && (<button onClick={function () { setIsPayslipAdminModalOpen(true); fetchPayslipRequests(); }} className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition">
                    Payslip Requests
                  </button>)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allWorkers.map(function (w) { return (<div key={w.id} role="button" tabIndex={0} onClick={function () { return handleViewWorker(w); }} onKeyDown={function (e) { if (e.key === 'Enter')
                handleViewWorker(w); }} className="group relative flex items-center gap-4 p-4 bg-white rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-all text-left cursor-pointer">
                  <div className="flex h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-200 text-zinc-500">
                    <div className="flex h-full w-full items-center justify-center"><lucide_react_1.User className="h-6 w-6"/></div>
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-zinc-900 truncate">{w.full_name}</p>
                    <p className="text-zinc-500 text-sm mt-1 truncate flex items-center gap-1">
                      <span>{w.job_title || "Transcriber"} · {w.department || "General"}</span>
                      {w.location ? (<span className="inline-flex items-center gap-1">
                          · {w.location}
                          <flag_icon_1.FlagIcon country={w.location} size={14}/>
                        </span>) : null}
                    </p>
                    {w.role && (<span className={"inline-flex rounded-full px-3 py-1 text-xs font-medium mt-2 ".concat(ROLE_BADGE_STYLES[w.role] || 'bg-zinc-100 text-zinc-700')}>
                        {formatRoleLabel(w.role)}
                      </span>)}
                  </div>
                  {isAdmin && w.id !== (user === null || user === void 0 ? void 0 : user.id) && (<button type="button" onClick={function (e) { e.stopPropagation(); handleDeleteWorker(w.id, w.full_name); }} className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-sm shadow-red-500/20 hover:bg-red-700 transition" aria-label="Delete worker">
                      <lucide_react_1.X className="h-4 w-4"/>
                    </button>)}
                </div>); })}
            </div>
          </div>) : (<div>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="mb-0">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    <div className="flex flex-col items-center gap-4 sm:items-start">
                      <div className="flex h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-zinc-200 text-zinc-500">
                        <div className="flex h-full w-full items-center justify-center"><lucide_react_1.User className="h-10 w-10"/></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-zinc-900">{(activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.full_name) || "Worker Details"}</h2>
                        {(activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.role) && (<span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-blue-800">
                            {activeWorker.role}
                          </span>)}
                        {isAdmin && (<button onClick={openEditWorkerModal} className="ml-auto inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition">
                            <lucide_react_1.Pencil className="h-3.5 w-3.5"/> Edit
                          </button>)}
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-zinc-700">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">📋</span>
                          <span>{(activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.job_title) || "Transcriber"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">🏢</span>
                          <span>{(activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.department) || "General"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">📍</span>
                          <span className="inline-flex items-center gap-2">
                            {(activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.location) || "N/A"}
                            {(activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.location) && <flag_icon_1.FlagIcon country={activeWorker.location} size={18}/>}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">✉️</span>
                          <span>{(activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.email) || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {hasBankColumns && (<Card className="border-l-4 border-cyan-500 mb-0 relative">
                <CardHeader className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-sm font-medium text-zinc-500">Bank Details</CardTitle>
                    <p className="text-xs text-zinc-400">Editable by authorized users.</p>
                  </div>
                </CardHeader>
                {canEditBank && (<button onClick={function () { return setIsBankModalOpen(true); }} className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition">
                    <lucide_react_1.CreditCard className="h-3.5 w-3.5"/> Edit
                  </button>)}
                <CardContent>
                  <div className="space-y-1.5 text-sm text-zinc-700">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-zinc-600">Bank Name</span>
                      <span>{(activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.bank_name) || "No bank name set"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-zinc-600">Account Number</span>
                      <span>{(activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.account_number) || "Not provided"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-zinc-600">Account Type</span>
                      <span>{(activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.account_type) || "Not provided"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-zinc-600">Routing Number</span>
                      <span>{(activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.routing_number) || "Not provided"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>)}
            </div>

            <div className="grid gap-4 md:grid-cols-3 mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-500">Total Files</CardTitle>
                  <lucide_react_1.FileText className="h-4 w-4 text-zinc-400"/>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-zinc-900">{filteredTotalFiles}</div>
                  <p className="text-xs text-zinc-500 mt-1">{filterApplied ? "Selected Period" : ""}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-500">Total Kilobytes</CardTitle>
                  <lucide_react_1.HardDrive className="h-4 w-4 text-zinc-400"/>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-zinc-900">{filteredTotalKB}</div>
                  <p className="text-xs text-zinc-500 mt-1">{filterApplied ? "Selected Period" : ""}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-500">Total Earnings</CardTitle>
                  <lucide_react_1.CreditCard className="h-4 w-4 text-zinc-400"/>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-zinc-900">{computedEarnings !== null && computedEarnings !== void 0 ? computedEarnings : '-'}</div>
                  <p className="text-xs text-zinc-500 mt-1">{computedEarnings ? "Based on ".concat(formatCurrency((activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.base_payment_per_60kb) || 700, activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.location), " per 60KB") : ''}</p>
                  <div className="flex gap-2 mt-4">
                    <button type="button" onClick={computeTotalEarnings} className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-slate-900/20 hover:bg-slate-700 transition">
                      Compute Total Earnings
                    </button>
                    {isAdmin && (<button type="button" onClick={function () { setIsPaymentModalOpen(true); setSelectedPaymentRate((activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.base_payment_per_60kb) || 700); }} className="inline-flex items-center gap-2 rounded-md border border-slate-900 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 transition">
                        <lucide_react_1.Pencil className="h-3.5 w-3.5"/> Edit Rate
                      </button>)}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-6 xl:grid-cols-[2fr_1fr] mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-black tracking-wider uppercase">Production Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-2">
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="flex flex-col">
                          <label className="text-[11px] text-zinc-600 font-medium mb-1">Start Date</label>
                          <input type="date" value={startDate} onChange={function (e) { setStartDate(e.target.value); setFilterApplied(false); }} className="border border-zinc-300 rounded-md px-2.5 py-1.5 text-sm text-zinc-700 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400" placeholder="mm/dd/yyyy"/>
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[11px] text-zinc-600 font-medium mb-1">End Date</label>
                          <input type="date" value={endDate} onChange={function (e) { setEndDate(e.target.value); setFilterApplied(false); }} className="border border-zinc-300 rounded-md px-2.5 py-1.5 text-sm text-zinc-700 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400" placeholder="mm/dd/yyyy"/>
                        </div>
                        <button onClick={applyFilters} className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-slate-900 via-zinc-900 to-stone-900 px-3.5 py-1.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:from-slate-700 hover:via-zinc-800 hover:to-stone-800 transition">
                          <span>⊡</span> Filter
                        </button>
                        {(startDate || endDate) && (<button onClick={clearFilters} className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md bg-zinc-500 text-white text-sm font-semibold hover:bg-zinc-800 active:bg-zinc-900 transition">
                            <lucide_react_1.X className="h-3.5 w-3.5"/> Clear
                          </button>)}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-100 text-zinc-700 uppercase text-[11px]">
                          <tr>
                            <th className="px-3 py-2 text-left rounded-l-md">File Name</th>
                            <th className="px-3 py-2 text-left">Date Completed</th>
                            <th className="px-3 py-2 text-left">Size (KB)</th>
                            {isAdmin && <th className="px-3 py-2 text-left rounded-r-md">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {records.length > 0 ? records.map(function (r) { return (<tr key={r.id} className="hover:bg-zinc-50">
                              <td className="px-3 py-2 font-medium text-zinc-900">{getDisplayFileName(r.file_name)}</td>
                              <td className="px-3 py-2 text-zinc-600">{r.date_completed}</td>
                              <td className="px-3 py-2 font-medium text-blue-600">{formatKB(r.byte_size)}</td>
                              {isAdmin && (<td className="px-3 py-2">
                                  <div className="flex items-center gap-1">
                                    <button onClick={function () { return openEditModal(r); }} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/80 hover:border-slate-300 hover:text-slate-900 hover:shadow-md transition">
                                      <lucide_react_1.Pencil className="h-4 w-4"/> Edit
                                    </button>
                                    <button onClick={function () { return handleDeleteRecord(r.id); }} className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-red-600 to-rose-500 px-2.5 py-1 text-sm font-semibold text-white shadow-sm shadow-red-500/20 hover:from-red-700 hover:to-rose-600 transition">
                                      <lucide_react_1.X className="h-4 w-4"/> Delete
                                    </button>
                                  </div>
                                </td>)}
                            </tr>); }) : (<tr>
                              <td colSpan={isAdmin ? 4 : 3} className="px-3 py-6 text-center text-zinc-500">No production records found.</td>
                            </tr>)}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                  <div className="border-t border-zinc-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-2">
                    {isAdmin && (<button onClick={function () { return setIsManualAddModalOpen(true); }} className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm shadow-zinc-200/70 hover:bg-zinc-50 transition">
                        <lucide_react_1.FileText className="h-4 w-4"/> Add File Manually
                      </button>)}
                    <button onClick={function () { return setIsUploadModalOpen(true); }} className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-slate-900 via-zinc-900 to-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:from-slate-700 hover:via-zinc-800 hover:to-stone-800 transition">
                      <lucide_react_1.Upload className="h-5 w-5"/> Upload File
                    </button>
                  </div>
                </Card>

                <Card className="mt-6">
                  <CardHeader className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-black tracking-wider uppercase">PAYSLIP REQUEST HISTORY</CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {((user === null || user === void 0 ? void 0 : user.id) === (activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.id) || isAdmin) && (<button type="button" onClick={function () { return setIsPayslipModalOpen(true); }} className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition">
                          Request Payslip
                        </button>)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {payslipRequests.length === 0 ? (<p className="text-sm text-zinc-500">No payslip requests yet for this worker.</p>) : (<div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                        {payslipRequests.map(function (r) { return (<div key={r.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-2">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <div className="text-xs font-semibold text-zinc-900">{r.cutoff_start} → {r.cutoff_end}</div>
                                <div className="text-xs text-zinc-500">Requested {new Date(r.requested_at).toLocaleDateString()}</div>
                              </div>
                              <div className="text-xs uppercase tracking-tight text-zinc-700">{r.status}</div>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              {r.payslip_url ? (<a href={r.payslip_url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white hover:bg-slate-700 transition">
                                  Download payslip
                                </a>) : r.status === 'approved' ? (<span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800">Approved - waiting for upload</span>) : (<span className="rounded-md bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-800">Waiting for approval</span>)}
                              {r.status === 'paid' && (<span className="rounded-md bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">Paid</span>)}
                            </div>
                          </div>); })}
                      </div>)}
                  </CardContent>
                </Card>
              </div>

              <Card className="h-[18rem] flex flex-col overflow-hidden">
                <CardHeader className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-black tracking-wider uppercase">Current Assignments</CardTitle>
                  </div>
                  {isAdmin && (<button onClick={function () { return setIsAddAssignmentModalOpen(true); }} className="inline-flex items-center gap-2 rounded-md border border-slate-900 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 transition">
                      <span>+</span> Add Assignment
                    </button>)}
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  {assignments.length === 0 ? (<p className="text-sm text-zinc-500">No assignments for this worker.</p>) : (<div className="space-y-2">
                      <div className={"grid ".concat(isAdmin ? 'grid-cols-[3fr_1fr_1fr_1fr]' : 'grid-cols-[3fr_1fr_1fr]', " gap-4 pb-2 border-b border-zinc-200")}>
                        <div className="text-xs font-semibold text-zinc-600 uppercase">Filename</div>
                        <div className="text-xs font-semibold text-zinc-600 uppercase">Due</div>
                        <div className="text-xs font-semibold text-zinc-600 uppercase">Status</div>
                        {isAdmin && <div className="text-xs font-semibold text-zinc-600 uppercase">Actions</div>}
                      </div>
                      {assignments.map(function (a) { return (<div key={a.id} className={"grid ".concat(isAdmin ? 'grid-cols-[3fr_1fr_1fr_1fr]' : 'grid-cols-[3fr_1fr_1fr]', " gap-4 items-center py-3 px-3 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 transition")>
                          <div>
                            <button type="button" onClick={function () { return setSelectedAssignment(a); }} className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline">
                              {getDisplayFileName(a.filename)}
                            </button>
                          </div>
                          <div className="text-sm text-zinc-600">{a.due_time ? a.due_time : 'No due time set'}</div>
                          <div className="flex items-center gap-2">
                            {a.status === 'done' ? (<span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800"><span aria-hidden="true">✓</span><span>Done</span></span>) : (<span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-800"><span aria-hidden="true">⏳</span><span>Pending</span></span>)}
                          </div>
                          {isAdmin && (<button onClick={function () { return deleteAssignment(a.id); }} className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition border border-red-200">
                              <lucide_react_1.X className="h-3.5 w-3.5"/> Delete
                            </button>)}
                        </div>); })}
                    </div>)}
                </CardContent>
              </Card>
            </div>

            {selectedAssignment && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
                  <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">Assignment details</h3>
                      <p className="text-sm text-zinc-500">More information for the selected filename</p>
                    </div>
                    <button type="button" onClick={function () { return setSelectedAssignment(null); }} className="text-zinc-400 hover:text-zinc-900">
                      <lucide_react_1.X className="h-5 w-5"/>
                    </button>
                  </div>
                  <div className="space-y-4 p-5">
                    <div>
                      <div className="text-xs font-semibold text-zinc-500 uppercase">Filename</div>
                      <div className="mt-1 text-sm font-medium text-zinc-900">{selectedAssignment.filename}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-500 uppercase">Due</div>
                      <div className="mt-1 text-sm text-zinc-700">{formatDate(selectedAssignment.created_at)}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-500 uppercase">Status</div>
                      <div className="mt-1">
                        {selectedAssignment.status === 'done' ? (<span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">✓ Done</span>) : (<span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-800">⏳ Pending</span>)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-500 uppercase">Created</div>
                      <div className="mt-1 text-sm text-zinc-700">{formatDate(selectedAssignment.created_at)}</div>
                    </div>
                  </div>
                  <div className="border-t border-zinc-200 p-5 text-right">
                    <button type="button" onClick={function () { return setSelectedAssignment(null); }} className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition">
                      Close
                    </button>
                  </div>
                </div>
              </div>)}

            {isAddAssignmentModalOpen && activeWorker && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
                  <button onClick={function () { setIsAddAssignmentModalOpen(false); setNewAssignmentFilename(""); }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><lucide_react_1.X className="h-5 w-5"/></button>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-4">Add New Assignment</h3>
                  <form onSubmit={function (e) { e.preventDefault(); addAssignment(activeWorker.id, newAssignmentFilename); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Filename</label>
                      <input type="text" value={newAssignmentFilename} onChange={function (e) { return setNewAssignmentFilename(e.target.value); }} placeholder="e.g., 771241201" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900" required/>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={function () { setIsAddAssignmentModalOpen(false); setNewAssignmentFilename(""); }} className="flex-1 rounded-md border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition">Cancel</button>
                      <button type="submit" disabled={isAddingAssignment} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-slate-900 to-zinc-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:from-slate-700 hover:to-zinc-800 disabled:opacity-50">
                        {isAddingAssignment ? "Adding..." : "Add Assignment"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>)}
          </div>)}
      </main>

      <footer className="border-t border-zinc-200 bg-white py-4">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-zinc-500">© {new Date().getFullYear()} All right reserved</div>
      </footer>

      {isAddWorkerModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={function () { setIsAddWorkerModalOpen(false); setNewWorkerForm({ fullName: "", jobTitle: "", department: "", email: "", password: "", role: "worker", location: 'United States' }); }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><lucide_react_1.X className="h-5 w-5"/></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Add New Worker</h3>
            <form onSubmit={handleAddWorker} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
                <input type="text" value={newWorkerForm.fullName} onChange={function (e) { return setNewWorkerForm(__assign(__assign({}, newWorkerForm), { fullName: e.target.value })); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Job Title</label>
                  <input type="text" value={newWorkerForm.jobTitle} onChange={function (e) { return setNewWorkerForm(__assign(__assign({}, newWorkerForm), { jobTitle: e.target.value })); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="e.g., Transcriber" required/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Department</label>
                  <input type="text" value={newWorkerForm.department} onChange={function (e) { return setNewWorkerForm(__assign(__assign({}, newWorkerForm), { department: e.target.value })); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="e.g., General" required/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email Address</label>
                <input type="email" value={newWorkerForm.email} onChange={function (e) { return setNewWorkerForm(__assign(__assign({}, newWorkerForm), { email: e.target.value })); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required/>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Temporary Password</label>
                <input type="password" value={newWorkerForm.password} onChange={function (e) { return setNewWorkerForm(__assign(__assign({}, newWorkerForm), { password: e.target.value })); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="Min. 6 characters" minLength={6} required/>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Role</label>
                <select value={newWorkerForm.role} onChange={function (e) { return setNewWorkerForm(__assign(__assign({}, newWorkerForm), { role: e.target.value })); }} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none" required>
                  <option value="worker">Worker</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Location</label>
                <select value={newWorkerForm.location} onChange={function (e) { return setNewWorkerForm(__assign(__assign({}, newWorkerForm), { location: e.target.value })); }} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none" required>
                  <option value="Australia">Australia {COUNTRY_FLAGS['Australia']}</option>
                  <option value="Canada">Canada {COUNTRY_FLAGS['Canada']}</option>
                  <option value="India">India {COUNTRY_FLAGS['India']}</option>
                  <option value="Philippines">Philippines {COUNTRY_FLAGS['Philippines']}</option>
                  <option value="United Kingdom">United Kingdom {COUNTRY_FLAGS['United Kingdom']}</option>
                  <option value="United States">United States {COUNTRY_FLAGS['United States']}</option>
                </select>
                <div className="mt-2 text-sm text-zinc-600 inline-flex items-center gap-2">
                  Selected: {newWorkerForm.location}
                  <flag_icon_1.FlagIcon country={newWorkerForm.location} size={18}/>
                </div>
              </div>
              <p className="text-xs text-zinc-500">A confirmation email will be sent to this address to activate the account.</p>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={function () { setIsAddWorkerModalOpen(false); setNewWorkerForm({ fullName: "", jobTitle: "", department: "", email: "", password: "", role: "worker", location: 'United States' }); }} className="flex-1 rounded-md border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition">Cancel</button>
                <button type="submit" disabled={isAddingWorker} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-slate-900 to-zinc-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:from-slate-700 hover:to-zinc-800 disabled:opacity-50">{isAddingWorker ? "Adding..." : "Add Worker"}</button>
              </div>
            </form>
          </div>
        </div>)}



      {isBankModalOpen && activeWorker && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={function () { setIsBankModalOpen(false); }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><lucide_react_1.X className="h-5 w-5"/></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Edit Bank Details</h3>
            <form onSubmit={handleSaveBankDetails} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Bank Name</label>
                <select value={bankForm.bankName} onChange={function (e) { return setBankForm(__assign(__assign({}, bankForm), { bankName: e.target.value })); }} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none" required>
                  <option value="">Select your bank</option>
                  <option value="BDO Unibank">BDO Unibank</option>
                  <option value="BPI">BPI</option>
                  <option value="Metrobank">Metrobank</option>
                  <option value="Land Bank of the Philippines">Land Bank of the Philippines</option>
                  <option value="PNB">PNB</option>
                  <option value="Security Bank">Security Bank</option>
                  <option value="UnionBank">UnionBank</option>
                  <option value="China Bank">China Bank</option>
                  <option value="RCBC">RCBC</option>
                  <option value="EastWest Bank">EastWest Bank</option>
                  <option value="Maybank Philippines">Maybank Philippines</option>
                  <option value="Philippine Veterans Bank">Philippine Veterans Bank</option>
                  <option value="Cebuana Lhuillier Bank">Cebuana Lhuillier Bank</option>
                  <option value="DBP">DBP</option>
                  <option value="PNB Savings">PNB Savings</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Account Number</label>
                <input type="text" value={bankForm.accountNumber} onChange={function (e) { return setBankForm(__assign(__assign({}, bankForm), { accountNumber: e.target.value })); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Account Type</label>
                  <select value={bankForm.accountType} onChange={function (e) { return setBankForm(__assign(__assign({}, bankForm), { accountType: e.target.value })); }} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none" required>
                    <option value="">Select account type</option>
                    <option value="Savings">Savings</option>
                    <option value="Checking">Checking</option>
                    <option value="Current">Current</option>
                    <option value="Peso Savings">Peso Savings</option>
                    <option value="Foreign Currency">Foreign Currency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Routing Number</label>
                  <input type="text" value={bankForm.routingNumber} onChange={function (e) { return setBankForm(__assign(__assign({}, bankForm), { routingNumber: e.target.value })); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required/>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={function () { return setIsBankModalOpen(false); }} className="flex-1 rounded-md border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition">Cancel</button>
                <button type="submit" disabled={isUpdatingBank} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-slate-900 to-zinc-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:from-slate-700 hover:to-zinc-800 disabled:opacity-50">
                  {isUpdatingBank ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {isPaymentModalOpen && activeWorker && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={function () { setIsPaymentModalOpen(false); }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><lucide_react_1.X className="h-5 w-5"/></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Edit Payment Rate</h3>
            <p className="text-sm text-zinc-600 mb-4">{selectedPaymentRate ? "".concat(formatCurrency(selectedPaymentRate, activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.location), " per 60KB") : 'Select a rate'}</p>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[700, 800, 900, 1000, 1100, 1200].map(function (rate) { return (<button key={rate} onClick={function () { return setSelectedPaymentRate(rate); }} className={"rounded-lg py-2 px-3 text-sm font-semibold transition ".concat(selectedPaymentRate === rate
                    ? 'bg-slate-900 text-white'
                    : 'border border-zinc-300 text-zinc-700 hover:border-slate-900')}>
                  {formatCurrency(rate, activeWorker === null || activeWorker === void 0 ? void 0 : activeWorker.location)}
                </button>); })}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={function () { return setIsPaymentModalOpen(false); }} className="flex-1 rounded-md border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition">Cancel</button>
              <button type="button" onClick={handleSavePaymentRate} disabled={isUpdatingPayment} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-slate-900 to-zinc-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:from-slate-700 hover:to-zinc-800 disabled:opacity-50">
                {isUpdatingPayment ? 'Updating...' : 'Update Rate'}
              </button>
            </div>
          </div>
        </div>)}

      {isUploadModalOpen && activeWorker && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={function () { setIsUploadModalOpen(false); setSelectedFile(null); }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><lucide_react_1.X className="h-5 w-5"/></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Upload New File</h3>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Select .txt File</label>
                <input type="file" accept=".txt" onChange={function (e) { var _a; return setSelectedFile(((_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0]) || null); }} className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"/>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={function () { setIsUploadModalOpen(false); setSelectedFile(null); }} className="flex-1 rounded-md border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition">Cancel</button>
                <button type="submit" disabled={isUploading} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-slate-900 to-zinc-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:from-slate-700 hover:to-zinc-800 disabled:opacity-50">
                  {isUploading ? "Uploading..." : "Upload File"}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {isManualAddModalOpen && activeWorker && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={function () { setIsManualAddModalOpen(false); setManualFileForm({ fileName: '', dateCompleted: '', byteSize: '' }); }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><lucide_react_1.X className="h-5 w-5"/></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Add File Manually</h3>
            <form onSubmit={handleAddManualRecord} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">File Name</label>
                <input type="text" value={manualFileForm.fileName} onChange={function (e) { return setManualFileForm(__assign(__assign({}, manualFileForm), { fileName: e.target.value })); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Date Completed</label>
                  <input type="date" value={manualFileForm.dateCompleted} onChange={function (e) { return setManualFileForm(__assign(__assign({}, manualFileForm), { dateCompleted: e.target.value })); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Size (KB)</label>
                  <input type="text" value={manualFileForm.byteSize} onChange={function (e) { return setManualFileForm(__assign(__assign({}, manualFileForm), { byteSize: e.target.value })); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="e.g. 14.5 KB" required/>
                </div>
              </div>
              <p className="text-xs text-zinc-500">Enter details for a new production record without uploading a file.</p>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={function () { setIsManualAddModalOpen(false); setManualFileForm({ fileName: '', dateCompleted: '', byteSize: '' }); }} className="flex-1 rounded-md border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition">Cancel</button>
                <button type="submit" disabled={isAddingManualRecord} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-slate-900 to-zinc-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:from-slate-700 hover:to-zinc-800 disabled:opacity-50">
                  {isAddingManualRecord ? 'Adding...' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {isPayslipModalOpen && activeWorker && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={function () { setIsPayslipModalOpen(false); setPayslipCutoffStart(''); setPayslipCutoffEnd(''); }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><lucide_react_1.X className="h-5 w-5"/></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Request Payslip</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Cutoff Start</label>
                <input type="date" value={payslipCutoffStart} onChange={function (e) { return setPayslipCutoffStart(e.target.value); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Cutoff End</label>
                <input type="date" value={payslipCutoffEnd} onChange={function (e) { return setPayslipCutoffEnd(e.target.value); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"/>
              </div>
              <p className="text-xs text-zinc-500">A payslip request will be sent to the admin for processing.</p>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={function () { setIsPayslipModalOpen(false); setPayslipCutoffStart(''); setPayslipCutoffEnd(''); }} className="flex-1 rounded-md border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition">Cancel</button>
                <button type="button" disabled={isRequestingPayslip} onClick={requestPayslip} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-slate-900 to-zinc-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:from-slate-700 hover:to-zinc-800 disabled:opacity-50">{isRequestingPayslip ? 'Requesting...' : 'Request Payslip'}</button>
              </div>
            </div>
          </div>
        </div>)}

      {isPayslipAdminModalOpen && isAdmin && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[80vh] overflow-y-auto">
            <button onClick={function () { return setIsPayslipAdminModalOpen(false); }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><lucide_react_1.X className="h-5 w-5"/></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Manage Payslip Requests</h3>
            <div className="space-y-4">
              {adminPayslipRequests.length === 0 ? (<p className="text-sm text-zinc-500">No payslip requests found.</p>) : (<div className="space-y-3">
                  {adminPayslipRequests.map(function (r) { return (<div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-md border border-zinc-200 bg-white">
                      <div>
                        <div className="text-sm font-semibold">
                          {r.worker_name ? (r.worker_name) : (<div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-zinc-600">{String(r.worker_id).slice(0, 8)}…</span>
                              <button disabled={loadingWorkerId === String(r.id)} onClick={function () { return loadWorkerInfo(r.worker_id, r.id); }} className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50 transition">
                                {loadingWorkerId === String(r.id) ? 'Loading…' : 'Show name'}
                              </button>
                            </div>)}
                        </div>
                        {r.worker_email && <div className="text-xs text-zinc-500">{r.worker_email}</div>}
                        <div className="text-xs text-zinc-500">{r.cutoff_start} → {r.cutoff_end}</div>
                        <div className="text-xs text-zinc-400 mt-1">Status: {r.status}</div>
                        {r.payslip_url && (<div className="mt-1 text-xs">
                            <a href={r.payslip_url} target="_blank" rel="noreferrer" className="font-medium text-slate-900 underline">
                              Download payslip
                            </a>
                          </div>)}
                      </div>
                      <div className="flex items-center gap-2">
                        {r.status !== 'approved' && (<button disabled={isProcessingRequest} onClick={function () { return updatePayslipRequestStatus(r.id, 'approved'); }} className="inline-flex items-center gap-2 rounded-md border border-slate-900 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50 transition">Approve</button>)}
                        {r.status === 'approved' && !r.payslip_url && (<label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 transition">
                            Upload payslip
                            <input type="file" accept="application/pdf" className="hidden" onChange={function (e) {
                            var _a;
                            var file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
                            if (file)
                                uploadPayslipFile(r.id, file);
                            e.target.value = '';
                        }}/>
                          </label>)}
                        {r.payslip_url && (<a href={r.payslip_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 transition">Download payslip</a>)}
                        {r.status !== 'paid' && (<button disabled={isProcessingRequest} onClick={function () { return updatePayslipRequestStatus(r.id, 'paid'); }} className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 transition">Mark Paid</button>)}
                        <button disabled={isProcessingRequest} onClick={function () { return deletePayslipRequest(r.id); }} className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition" title="Delete payslip request">
                          <lucide_react_1.Trash2 className="h-3.5 w-3.5"/>
                        </button>
                      </div>
                    </div>); })}
                </div>)}
            </div>
          </div>
        </div>)}

      {isEditWorkerModalOpen && activeWorker && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={function () { return setIsEditWorkerModalOpen(false); }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><lucide_react_1.X className="h-5 w-5"/></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Edit Worker Details</h3>
            <form onSubmit={handleSaveWorkerDetails} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
                <input type="text" value={editWorkerForm.fullName} onChange={function (e) { return setEditWorkerForm(__assign(__assign({}, editWorkerForm), { fullName: e.target.value })); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Job Title</label>
                  <input type="text" value={editWorkerForm.jobTitle} onChange={function (e) { return setEditWorkerForm(__assign(__assign({}, editWorkerForm), { jobTitle: e.target.value })); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="e.g., Transcriber" required/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Department</label>
                  <input type="text" value={editWorkerForm.department} onChange={function (e) { return setEditWorkerForm(__assign(__assign({}, editWorkerForm), { department: e.target.value })); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="e.g., General" required/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                <input type="email" value={editWorkerForm.email} onChange={function (e) { return setEditWorkerForm(__assign(__assign({}, editWorkerForm), { email: e.target.value })); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="admin@example.com" required/>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Location</label>
                <select value={editWorkerForm.location} onChange={function (e) { return setEditWorkerForm(__assign(__assign({}, editWorkerForm), { location: e.target.value })); }} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none" required>
                  <option value="Australia">Australia {COUNTRY_FLAGS['Australia']}</option>
                  <option value="Canada">Canada {COUNTRY_FLAGS['Canada']}</option>
                  <option value="India">India {COUNTRY_FLAGS['India']}</option>
                  <option value="Philippines">Philippines {COUNTRY_FLAGS['Philippines']}</option>
                  <option value="United Kingdom">United Kingdom {COUNTRY_FLAGS['United Kingdom']}</option>
                  <option value="United States">United States {COUNTRY_FLAGS['United States']}</option>
                </select>
                <div className="mt-2 text-sm text-zinc-600 inline-flex items-center gap-2">
                  Selected: {editWorkerForm.location}
                  <flag_icon_1.FlagIcon country={editWorkerForm.location} size={18}/>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={function () { return setIsEditWorkerModalOpen(false); }} className="flex-1 rounded-md border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition">Cancel</button>
                <button type="submit" disabled={isUpdatingWorkerDetails} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-slate-900 to-zinc-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:from-slate-700 hover:to-zinc-800 disabled:opacity-50">
                  {isUpdatingWorkerDetails ? 'Saving...' : <span className="flex items-center gap-2"><lucide_react_1.Save className="h-4 w-4"/> Save</span>}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {isEditModalOpen && editingRecord && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={function () { return setIsEditModalOpen(false); }} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><lucide_react_1.X className="h-5 w-5"/></button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Edit Record</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">File Name</label>
                <input type="text" value={editForm.file_name} onChange={function (e) { return setEditForm(__assign(__assign({}, editForm), { file_name: e.target.value })); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Date Completed</label>
                <input type="date" value={editForm.date_completed} onChange={function (e) { return setEditForm(__assign(__assign({}, editForm), { date_completed: e.target.value })); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Byte Size (KB)</label>
                <input type="text" value={editForm.byte_size} onChange={function (e) { return setEditForm(__assign(__assign({}, editForm), { byte_size: e.target.value })); }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"/>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={function () { return setIsEditModalOpen(false); }} className="flex-1 px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-md hover:bg-zinc-200">Cancel</button>
              <button onClick={saveEdit} disabled={isSaving} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-slate-900 to-zinc-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:from-slate-700 hover:to-zinc-800 disabled:opacity-50">
                {isSaving ? "Saving..." : <span className="flex items-center gap-2"><lucide_react_1.Save className="h-4 w-4"/> Save</span>}
              </button>
            </div>
          </div>
        </div>)}


    </div>);
}
