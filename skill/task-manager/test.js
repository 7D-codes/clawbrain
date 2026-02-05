#!/usr/bin/env bun
/**
 * Test script for Task Manager Skill
 */

import taskManagerSkill, { createTask, listTasks, getTask, updateTask, deleteTask } from './index.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const TEST_DIR = path.join(os.homedir(), 'clawdbrain', 'tasks');

async function cleanup() {
  try {
    const files = await fs.readdir(TEST_DIR);
    for (const file of files) {
      if (file.startsWith('task-') && file.endsWith('.md')) {
        await fs.unlink(path.join(TEST_DIR, file));
      }
    }
    console.log('✓ Cleaned up test files');
  } catch {
    // Directory might not exist
  }
}

async function test() {
  console.log('🧪 Testing Task Manager Skill\n');
  
  const context = { TASKS_DIR: TEST_DIR };
  
  // Test 1: Create task
  console.log('Test 1: Create task');
  const createResult = await createTask(context, {
    title: 'Research competitors',
    project: 'clawbrain',
    description: 'Analyze top 3 competitors in AI workspace market.'
  });
  
  if (createResult.success) {
    console.log('✓ Task created:', createResult.task.title);
    console.log('  ID:', createResult.task.id);
    console.log('  Slug:', createResult.task.slug);
    console.log('  Project:', createResult.task.project);
  } else {
    console.log('✗ Failed to create task:', createResult.error);
  }
  
  // Test 2: List tasks
  console.log('\nTest 2: List tasks');
  const listResult = await listTasks(context);
  
  if (listResult.count > 0) {
    console.log('✓ Found', listResult.count, 'task(s)');
    listResult.tasks.forEach(t => {
      console.log(`  - ${t.title} (${t.status})`);
    });
  } else {
    console.log('✗ No tasks found');
  }
  
  // Test 3: Get task by slug
  console.log('\nTest 3: Get task by slug');
  const getResult = await getTask(context, { slug: 'research-competitors' });
  
  if (getResult.found) {
    console.log('✓ Found task:', getResult.task.title);
  } else {
    console.log('✗ Task not found:', getResult.error);
  }
  
  // Test 4: Update task status
  console.log('\nTest 4: Update task status');
  const taskId = createResult.task.id;
  const updateResult = await updateTask(context, {
    id: taskId,
    status: 'in-progress'
  });
  
  if (updateResult.success) {
    console.log('✓ Updated task status to:', updateResult.task.status);
  } else {
    console.log('✗ Failed to update:', updateResult.error);
  }
  
  // Test 5: Update task title
  console.log('\nTest 5: Update task title');
  const updateTitleResult = await updateTask(context, {
    id: taskId,
    title: 'Research AI competitors thoroughly'
  });
  
  if (updateTitleResult.success) {
    console.log('✓ Updated task title to:', updateTitleResult.task.title);
    console.log('  New slug:', updateTitleResult.task.slug);
  } else {
    console.log('✗ Failed to update:', updateTitleResult.error);
  }
  
  // Test 6: Command parsing - create task
  console.log('\nTest 6: Command parsing - create task');
  const cmdResult1 = await taskManagerSkill(context, 'create task: "Build landing page" in project clawbrain');
  
  if (cmdResult1.success) {
    console.log('✓ Command parsed, task created:', cmdResult1.task.title);
  } else {
    console.log('✗ Command failed:', cmdResult1.error);
  }
  
  // Test 7: Command parsing - list tasks
  console.log('\nTest 7: Command parsing - list tasks');
  const cmdResult2 = await taskManagerSkill(context, 'list tasks in project clawbrain');
  
  if (cmdResult2.count !== undefined) {
    console.log('✓ Command parsed, found', cmdResult2.count, 'task(s)');
  } else {
    console.log('✗ Command failed:', cmdResult2.error);
  }
  
  // Test 8: Command parsing - update status
  console.log('\nTest 8: Command parsing - update status');
  const cmdResult3 = await taskManagerSkill(context, `update task ${taskId} status to done`);
  
  if (cmdResult3.success) {
    console.log('✓ Command parsed, status updated to:', cmdResult3.task.status);
  } else {
    console.log('✗ Command failed:', cmdResult3.error);
  }
  
  // Test 9: Command parsing - delete task
  console.log('\nTest 9: Command parsing - delete task');
  const cmdResult4 = await taskManagerSkill(context, `delete task ${taskId}`);
  
  if (cmdResult4.success) {
    console.log('✓ Command parsed, task deleted:', cmdResult4.deleted.title);
  } else {
    console.log('✗ Command failed:', cmdResult4.error);
  }
  
  // Test 10: Verify file format
  console.log('\nTest 10: Verify file format');
  const finalList = await listTasks(context);
  if (finalList.count > 0) {
    const filePath = path.join(TEST_DIR, `task-${finalList.tasks[0].id}.md`);
    const content = await fs.readFile(filePath, 'utf-8');
    console.log('✓ File content preview:');
    console.log(content.split('\n').slice(0, 10).join('\n'));
  }
  
  console.log('\n✅ All tests completed!');
}

// Run tests
test().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
}).finally(async () => {
  await cleanup();
});
