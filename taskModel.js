// const mongoose = require('mongoose');
import mongoose from 'mongoose';


const taskSchema = new mongoose.Schema({
  email: { type: String, required: true },
  task: { type: String, required: true },
  time: { type: String, required: true }
});

const TaskModel = mongoose.model('Task', taskSchema);

// module.exports = TaskModel;
export default TaskModel;