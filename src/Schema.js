export const schema = {
  title: 'Anonymous chat schema',
  description: 'Database schema for an anonymous chat',
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: {
      type: 'string',
      primary: true
    },
    message: {
      type: 'string'
    }
  },
  required: ['message']
}