import request from '@/utils/request'

// ========== AI ==========
export const aiApi = {
  predictChurn: (customerId) => request.get(`/ai/churn-prediction?customerId=${customerId}`),
  batchChurn: (customerIds) => request.get(`/ai/churn-batch?customerIds=${customerIds}`),
  marketingCopy: (params) => request.post('/ai/marketing-copy', params),
  salesScript: (stage, tags) => request.get(`/ai/sales-script?stage=${stage}&customerTags=${tags || ''}`),
  customerProfile: (customerId) => request.get(`/ai/customer-profile?customerId=${customerId}`),
  agentCommand: (command) => request.post('/ai/agent/command', { command }),
  rfmAnalysis: () => request.get('/ai/rfm-analysis'),
  salesForecast: () => request.get('/ai/sales-forecast'),
  todayPriority: () => request.get('/ai/today-priority'),
}

// ========== Contacts ==========
export const contactApi = {
  list: (params) => request.get('/contacts/list', { params }),
  getById: (id) => request.get(`/contacts/${id}`),
  create: (data) => request.post('/contacts', data),
  update: (data) => request.put('/contacts', data),
  delete: (id) => request.delete(`/contacts/${id}`),
}

// ========== Leads ==========
export const leadApi = {
  list: (params) => request.get('/leads/list', { params }),
  getById: (id) => request.get(`/leads/${id}`),
  create: (data) => request.post('/leads', data),
  update: (data) => request.put('/leads', data),
  delete: (id) => request.delete(`/leads/${id}`),
  convert: (id) => request.post(`/leads/convert/${id}`),
  follow: (id, data) => request.post(`/leads/${id}/follow`, data),
  assign: (id, data) => request.put(`/leads/${id}/assign`, data),
  pool: (params) => request.get('/leads/pool', { params }),
}

// ========== Opportunities ==========
export const opportunityApi = {
  list: (params) => request.get('/opportunities/list', { params }),
  getById: (id) => request.get(`/opportunities/${id}`),
  create: (data) => request.post('/opportunities', data),
  update: (data) => request.put('/opportunities', data),
  updateStage: (id, data) => request.put(`/opportunities/${id}/stage`, data),
  addTeamMember: (id, data) => request.post(`/opportunities/${id}/team`, data),
  removeTeamMember: (id, userId) => request.delete(`/opportunities/${id}/team/${userId}`),
  addCompetitor: (id, data) => request.post(`/opportunities/${id}/competitor`, data),
  funnel: () => request.get('/opportunities/funnel'),
  delete: (id) => request.delete(`/opportunities/${id}`),
}

// ========== Quotations ==========
export const quotationApi = {
  list: (params) => request.get('/quotations/list', { params }),
  getById: (id) => request.get(`/quotations/${id}`),
  create: (data) => request.post('/quotations', data),
  update: (data) => request.put('/quotations', data),
  submit: (id) => request.post(`/quotations/${id}/submit`),
  approve: (id) => request.post(`/quotations/${id}/approve`),
  reject: (id) => request.post(`/quotations/${id}/reject`),
  convertToOrder: (id) => request.post(`/quotations/${id}/convert-to-order`),
  delete: (id) => request.delete(`/quotations/${id}`),
}

// ========== Products ==========
export const productApi = {
  list: (params) => request.get('/products/list', { params }),
  getById: (id) => request.get(`/products/${id}`),
  create: (data) => request.post('/products', data),
  update: (data) => request.put('/products', data),
  delete: (id) => request.delete(`/products/${id}`),
  getPrices: (productId) => request.get(`/products/prices/${productId}`),
}

// ========== Marketing Activities ==========
export const activityApi = {
  list: (params) => request.get('/marketing-activities/list', { params }),
  getById: (id) => request.get(`/marketing-activities/${id}`),
  create: (data) => request.post('/marketing-activities', data),
  update: (data) => request.put('/marketing-activities', data),
  delete: (id) => request.delete(`/marketing-activities/${id}`),
  addExpense: (id, data) => request.post(`/marketing-activities/${id}/expenses`, data),
  getExpenses: (id) => request.get(`/marketing-activities/${id}/expenses`),
  getAnalysis: (id) => request.get(`/marketing-activities/${id}/analysis`),
}

// ========== Service ==========
export const serviceApi = {
  listRequests: (params) => request.get('/service-requests/list', { params }),
  getRequest: (id) => request.get(`/service-requests/${id}`),
  createRequest: (data) => request.post('/service-requests', data),
  updateRequest: (data) => request.put('/service-requests', data),
  createTicket: (id, data) => request.post(`/service-requests/${id}/ticket`, data),
  getTickets: (id) => request.get(`/service-requests/${id}/tickets`),
  listTickets: (params) => request.get('/service-tickets/list', { params }),
  getTicket: (id) => request.get(`/service-tickets/${id}`),
  assignTicket: (id, data) => request.put(`/service-tickets/${id}/assign`, data),
  updateTicketStatus: (id, data) => request.put(`/service-tickets/${id}/status`, data),
  addTicketLog: (id, data) => request.post(`/service-tickets/${id}/log`, data),
  completeTicket: (id, data) => request.put(`/service-tickets/${id}/complete`, data),
}

// ========== Schedule & Tasks ==========
export const scheduleApi = {
  list: (params) => request.get('/schedules/list', { params }),
  calendar: (start, end) => request.get(`/schedules/calendar?start=${start}&end=${end}`),
  getById: (id) => request.get(`/schedules/${id}`),
  create: (data) => request.post('/schedules', data),
  update: (data) => request.put('/schedules', data),
  delete: (id) => request.delete(`/schedules/${id}`),
  teamSchedules: () => request.get('/schedules/team'),
}

export const taskApi = {
  list: (params) => request.get('/tasks/list', { params }),
  getById: (id) => request.get(`/tasks/${id}`),
  create: (data) => request.post('/tasks', data),
  update: (data) => request.put('/tasks', data),
  updateStatus: (id, data) => request.put(`/tasks/${id}/status`, data),
  complete: (id) => request.put(`/tasks/${id}/complete`),
  delete: (id) => request.delete(`/tasks/${id}`),
}

// ========== Notices & Mails ==========
export const noticeApi = {
  list: (params) => request.get('/notices/list', { params }),
  getById: (id) => request.get(`/notices/${id}`),
  create: (data) => request.post('/notices', data),
  update: (data) => request.put('/notices', data),
  publish: (id) => request.put(`/notices/${id}/publish`),
  delete: (id) => request.delete(`/notices/${id}`),
  unreadCount: () => request.get('/notices/unread-count'),
  latest: () => request.get('/notices/latest'),
}

export const mailApi = {
  inbox: (params) => request.get('/mails/inbox', { params }),
  sent: (params) => request.get('/mails/sent', { params }),
  unreadCount: () => request.get('/mails/unread-count'),
  getById: (id) => request.get(`/mails/${id}`),
  send: (data) => request.post('/mails', data),
  reply: (id, data) => request.post(`/mails/${id}/reply`, data),
  markRead: (id) => request.put(`/mails/${id}/read`),
  toggleStar: (id) => request.put(`/mails/${id}/star`),
}

// ========== Others ==========
export const customerExtendApi = {
  assign: (data) => request.post('/customers-extend/assign', data),
  reclaim: (data) => request.post('/customers-extend/reclaim', data),
  merge: (data) => request.post('/customers-extend/merge', data),
  share: (data) => request.post('/customers-extend/share', data),
  removeShare: (id) => request.delete(`/customers-extend/share/${id}`),
  getTags: (customerId) => request.get(`/customers-extend/tags/${customerId}`),
  addTag: (data) => request.post('/customers-extend/tags', data),
  removeTag: (relId) => request.delete(`/customers-extend/tags/${relId}`),
}

export const deliveryApi = {
  list: (params) => request.get('/deliveries/list', { params }),
  getById: (id) => request.get(`/deliveries/${id}`),
  create: (data) => request.post('/deliveries', data),
  ship: (id, data) => request.put(`/deliveries/${id}/ship`, data),
  sign: (id) => request.put(`/deliveries/${id}/sign`),
}

export const receivableApi = {
  plans: (params) => request.get('/receivables/plans', { params }),
  createPlan: (data) => request.post('/receivables/plans', data),
  records: (params) => request.get('/receivables/records', { params }),
  createRecord: (data) => request.post('/receivables/records', data),
  overdue: () => request.get('/receivables/overdue'),
}

export const invoiceApi = {
  list: (params) => request.get('/invoices/list', { params }),
  getById: (id) => request.get(`/invoices/${id}`),
  create: (data) => request.post('/invoices', data),
  issue: (id, data) => request.put(`/invoices/${id}/issue`, data),
  cancel: (id) => request.put(`/invoices/${id}/cancel`),
}

export const approvalApi = {
  flows: () => request.get('/approvals/flows'),
  createFlow: (data) => request.post('/approvals/flows', data),
  submit: (data) => request.post('/approvals/submit', data),
  approve: (data) => request.post('/approvals/approve', data),
  reject: (data) => request.post('/approvals/reject', data),
  pending: () => request.get('/approvals/pending'),
  history: (type, id) => request.get(`/approvals/history/${type}/${id}`),
}

export const documentApi = {
  list: (params) => request.get('/documents/list', { params }),
  upload: (formData) => request.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => request.delete(`/documents/${id}`),
}

export const teamApi = {
  list: () => request.get('/sales-teams/list'),
  getById: (id) => request.get(`/sales-teams/${id}`),
  create: (data) => request.post('/sales-teams', data),
  update: (data) => request.put('/sales-teams', data),
  delete: (id) => request.delete(`/sales-teams/${id}`),
  addMember: (id, data) => request.post(`/sales-teams/${id}/members`, data),
  removeMember: (id, userId) => request.delete(`/sales-teams/${id}/members/${userId}`),
}

export const dictApi = {
  types: () => request.get('/dict/types'),
  createType: (data) => request.post('/dict/types', data),
  data: (dictType) => request.get(`/dict/data/${dictType}`),
  createData: (data) => request.post('/dict/data', data),
  updateData: (data) => request.put('/dict/data', data),
}

export const analyticsApi = {
  dashboard: () => request.get('/analytics/dashboard'),
  salesTrend: (months = 12) => request.get(`/analytics/sales-trend?months=${months}`),
  funnel: () => request.get('/analytics/funnel'),
  customerSource: () => request.get('/analytics/customer-source'),
  employeeRanking: () => request.get('/analytics/employee-ranking'),
}

export const configApi = {
  list: () => request.get('/sys-config/list'),
  getByKey: (key) => request.get(`/sys-config/${key}`),
  update: (data) => request.put('/sys-config', data),
}
