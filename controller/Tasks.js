import pool from "../db.js";

export const getAllTasks = async (req, res) => {
  try {
    const allTasks = await pool.query("SELECT * FROM tasks ");
    res.json(allTasks.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTasks = async (req, res) => {
  const { employeeId, date } = req.params;

  try {
    const result = await pool.query(
      `
        SELECT 
          t.*,
          COALESCE(SUM(EXTRACT(EPOCH FROM (t.end_time - t.start_time))/3600), 0) as total_hours
        FROM tasks t
        WHERE employee_id = $1 AND date = $2
        GROUP BY t.id
      `,
      [employeeId, date]
    );
    const tasks = result.rows;
    const total_hours = tasks.reduce(
      (acc, task) => acc + parseFloat(task.total_hours),
      0
    );
    const remaining_hours = 8 - total_hours;

    const summary = {
      total_hours,
      remaining_hours,
      tasks,
    };

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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
    console.error("Error deleting task:", err); // Log the error for debugging purposes
    res
      .status(500)
      .json({ error: "An error occurred while deleting the task" });
  }
};
