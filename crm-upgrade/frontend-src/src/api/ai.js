import request from './request'

export function getSalesScript(opportunityId) {
  return request({ url: `/ai/sales-script/${opportunityId}`, method: 'get' })
}
