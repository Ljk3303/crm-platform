import request from './request'

export function getLeadList(params) {
  return request({ url: '/leads', method: 'get', params })
}

export function getLeadDetail(id) {
  return request({ url: `/leads/${id}`, method: 'get' })
}

export function createLead(data) {
  return request({ url: '/leads', method: 'post', data })
}

export function updateLead(id, data) {
  return request({ url: `/leads/${id}`, method: 'put', data })
}

export function deleteLead(id) {
  return request({ url: `/leads/${id}`, method: 'delete' })
}

export function convertLead(id) {
  return request({ url: `/leads/${id}/convert`, method: 'post' })
}

export function getLeadFollowUps(id, params) {
  return request({ url: `/leads/${id}/follow-ups`, method: 'get', params })
}

export function createFollowUp(id, data) {
  return request({ url: `/leads/${id}/follow-ups`, method: 'post', data })
}

export function getPoolLeads(params) {
  return request({ url: '/leads/pool', method: 'get', params })
}

export function claimLead(id) {
  return request({ url: `/leads/pool/${id}/claim`, method: 'post' })
}
