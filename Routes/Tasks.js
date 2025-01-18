const router = require("express").Router();
const {getAllTasks,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} = require("../controller/Tasks");


router.get("/all",getAllTasks);
router.get("/summary/:employeeId/:date", getTasks);
router.post("/", createTask);
router.patch("/:taskId", updateTask);
router.delete("/:taskId", deleteTask);



module.exports=router;
