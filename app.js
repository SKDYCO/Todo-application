const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initialiseDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running....')
    })
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
    process.exit(1);
  }
}

initialiseDBAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}
const hasTodoProperty = requestBody => {
  return requestBody.todo !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`
      break
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`
  }

  data = await db.all(getTodosQuery)
  response.send(data)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoDEtailsQuery = `
    SELECT *FROM todo WHERE id=${todoId};
  `
  const result = await db.get(getTodoDEtailsQuery)
  response.send(result)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const postTodoQuery = `
    INSERT INTO todo (id,todo,priority,status) VALUES
    (${id},"${todo}","${priority}","${status}")
  `
  await db.run(postTodoQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const {todo, priority, status} = request.body
  let updateTodoQuery = null
  let result = null
  switch (true) {
    case hasTodoProperty(request.body):
      updateTodoQuery = `
        UPDATE todo SET
        todo="${todo}"
        WHERE id=${todoId};
      `
      result = 'Todo Updated'
      break
    case hasPriorityProperty(request.body):
      updateTodoQuery = `
        UPDATE todo SET
        priority="${priority}"
        WHERE id=${todoId};
      `
      result = 'Priority Updated'
      break
    case hasStatusProperty(request.body):
      updateTodoQuery = `
        UPDATE todo SET
        status="${status}"
        WHERE id=${todoId};
      `
      result = 'Status Updated'
  }
  await db.run(updateTodoQuery)
  response.send(result)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
    DELETE FROM todo WHERE id=${todoId};
  `
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})
module.exports = app