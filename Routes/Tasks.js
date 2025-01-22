import { Router } from 'express'; 
import { 
  getAllTasks, 
  createTask, 
  updateTask, 
  deleteTask, 
} from "../controller/Tasks.js";  
 
const router = Router(); 
 
router.get("/all", getAllTasks); 
// router.get("/summary/:employeeId/:date", getTasks); 
router.post("/", createTask); 
router.patch("/:taskId", updateTask); 
router.delete("/:taskId", deleteTask); 
 
export default router;

