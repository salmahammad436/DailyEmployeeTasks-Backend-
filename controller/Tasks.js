import pool from "../db.js";

export const getAllTasks = async (req, res) => {
  try {
    const query = `
      SELECT 
        t.*,
        e.name AS employee_name,
        -- Calculate the total hours worked based on start_time and end_time
        CASE 
          WHEN (t.date + t.end_time::time)::timestamp > CURRENT_TIMESTAMP 
          THEN 
            EXTRACT(EPOCH FROM ((t.date + t.end_time::time)::timestamp - (t.date + t.start_time::time)::timestamp))/3600
          ELSE 0 
        END AS total_hours_worked,
        
        -- Calculate remaining hours by subtracting worked hours from 8
        CASE 
          WHEN (t.date + t.end_time::time)::timestamp > CURRENT_TIMESTAMP 
          THEN 
            8 - (EXTRACT(EPOCH FROM ((t.date + t.end_time::time)::timestamp - (t.date + t.start_time::time)::timestamp))/3600)
          ELSE 0 
        END AS remaining_hours,
        
        -- Determine the task status
        CASE 
          WHEN (t.date + t.end_time::time)::timestamp < CURRENT_TIMESTAMP THEN 'completed'
          WHEN (t.date + t.start_time::time)::timestamp <= CURRENT_TIMESTAMP AND 
               (t.date + t.end_time::time)::timestamp >= CURRENT_TIMESTAMP THEN 'in-progress'
          ELSE 'pending'
        END AS status
      FROM tasks t
      LEFT JOIN employees e ON t.employee_id = e.id
      ORDER BY 
        t.date DESC,
        t.start_time ASC
    `;
    
    const allTasks = await pool.query(query);
    
    // Format the response to round remaining hours
    const formattedTasks = allTasks.rows.map(task => ({
      ...task,
      remaining_hours: task.remaining_hours > 0 
        ? Math.round(task.remaining_hours * 10) / 10 
        : 0,
      total_hours_worked: Math.round(task.total_hours_worked * 10) / 10 // You can also round worked hours if necessary
    }));

    res.json(formattedTasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ 
      error: 'Failed to fetch tasks',
      details: err.message 
    });
  }
};



// export const getTasks = async (req, res) => {
//   const { employeeId, date } = req.params;
//   try {
//     const result = await pool.query(
//       `
//         SELECT 
//           t.*,
//           COALESCE(SUM(EXTRACT(EPOCH FROM (t.end_time - t.start_time))/3600), 0) as total_hours
//         FROM tasks t
//         WHERE employee_id = $1 AND date = $2
//         GROUP BY t.id
//       `,
//       [employeeId, date] 
//     );
//     const tasks = result.rows;
//     const total_hours = tasks.reduce(
//       (acc, task) => acc + parseFloat(task.total_hours),
//       0
//     );


//     const remaining_hours = 8 - total_hours;

//     const summary = {
//       total_hours,
//       remaining_hours,
//       tasks,
//     };

//     res.json(summary);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

//createTask
export const createTask = async (req, res) => {
  const { employee_id, description, start_time, end_time, date } = req.body;
  try {
    const result = await pool.query(
      `
        INSERT INTO tasks (employee_id, description, start_time, end_time, date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
      [employee_id, description, start_time, end_time, date]
    );
    const task = result.rows[0];
    if (!task) {
      return res.status(400).json({ error: "Task not created" });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTask = async (req, res) => {
  const { taskId } = req.params;
  const { description, start_time, end_time } = req.body;

  try {
    // Create an array of values to update
    const values = [];
    let query = `UPDATE tasks SET `;

    // Set description if it's provided
    if (description) {
      values.push(description);
      query += `description = $${values.length}, `;
    }

    // Set start_time if it's provided
    if (start_time) {
      values.push(start_time);
      query += `start_time = $${values.length}, `;
    }

    // Set end_time if it's provided
    if (end_time) {
      values.push(end_time);
      query += `end_time = $${values.length}, `;
    }

    // Remove the last comma and space
    query = query.slice(0, -2);

    query += ` WHERE id = $${values.length + 1} RETURNING *`;

    // Add taskId to the values array
    values.push(taskId);

    const result = await pool.query(query, values);

    if (!result.rows[0]) {
      return res.status(400).json({ error: "Task not updated" });
    }

    const task = result.rows[0];
    res.json({ message: "The task is updated successfully", task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


//deleteTask
export const deleteTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    // Attempt to delete the task
    const result = await pool.query(
      `DELETE FROM tasks WHERE id=$1 RETURNING id`,
      [taskId]
    );

    // Check if the task was found and deleted
    if (!result.rows[0]) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Task was deleted successfully, return a success message
    res.status(200).json({
      message: "The task was deleted successfully",
      deletedTaskId: result.rows[0].id,
    });
  } catch (err) {
    // Handle unexpected errors
    console.error("Error deleting task:", err);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the task" });
  }
};
