import request from './request'

export function getOpportunityList(params) {
  return request({ url: '/opportunities', method: 'get', params })
}

export function getOpportunityDetail(id) {
  return request({ url: `/opportunities/${id}`, method: 'get' })
}

export function createOpportunity(data) {
  return request({ url: '/opportunities', method: 'post', data })
}

export function updateOpportunity(id, data) {
  return request({ url: `/opportunities/${id}`, method: 'put', data })
}

export function deleteOpportunity(id) {
  return request({ url: `/opportunities/${id}`, method: 'delete' })
}

export function changeStage(id, data) {
  return request({ url: `/opportunities/${id}/stage`, method: 'put', data })
}

export function getStageHistory(id) {
  return request({ url: `/opportunities/${id}/stage-history`, method: 'get' })
}

export function getTeamMembers(id) {
  return request({ url: `/opportunities/${id}/team`, method: 'get' })
}

export function addTeamMember(id, data) {
  return request({ url: `/opportunities/${id}/team`, method: 'post', data })
}

export function removeTeamMember(oppId, userId) {
  return request({ url: `/opportunities/${oppId}/team/${userId}`, method: 'delete' })
}

export function getCompetitors(id) {
  return request({ url: `/opportunities/${id}/competitors`, method: 'get' })
}

export function addCompetitor(id, data) {
  return request({ url: `/opportunities/${id}/competitors`, method: 'post', data })
}

export function removeCompetitor(oppId, compId) {
  return request({ url: `/opportunities/${oppId}/competitors/${compId}`, method: 'delete' })
}
