import { VirtualFileSystem } from './VirtualFileSystem';

export interface Task {
  id: number;
  title: string;
  description: string;
  hint: string;
  xp: number;
  check: (vfs: VirtualFileSystem) => boolean;
}

export const tasks: Task[] = [
  {
    id: 1,
    title: 'Create a folder named "Practice"',
    description: 'Right-click on the Desktop and choose New Folder. Name it Practice.',
    hint: 'Right-click on empty space in the Desktop folder, then select "New Folder".',
    xp: 10,
    check: (vfs) => {
      const desktop = vfs.getChildren(vfs.getDesktopId());
      return desktop.some((n) => n.type === 'folder' && n.name === 'Practice');
    },
  },
  {
    id: 2,
    title: 'Create a file named "notes.txt"',
    description: 'Create a new text file called notes.txt on the Desktop.',
    hint: 'Right-click on empty space, choose "New File", and type notes.txt',
    xp: 10,
    check: (vfs) => {
      const desktop = vfs.getChildren(vfs.getDesktopId());
      return desktop.some((n) => n.type === 'file' && n.name === 'notes.txt');
    },
  },
  {
    id: 3,
    title: 'Rename notes.txt to my-notes.txt',
    description: 'Select notes.txt, press F2 (or right-click → Rename), and change the name to my-notes.txt.',
    hint: 'Right-click on notes.txt and choose "Rename", or select it and press F2.',
    xp: 10,
    check: (vfs) => {
      const desktop = vfs.getChildren(vfs.getDesktopId());
      return (
        desktop.some((n) => n.type === 'file' && n.name === 'my-notes.txt') &&
        !desktop.some((n) => n.type === 'file' && n.name === 'notes.txt')
      );
    },
  },
  {
    id: 4,
    title: 'Create a folder named "Projects"',
    description: 'Create a Projects folder on the Desktop (the sidebar may already list a library — make one on the Desktop for this task).',
    hint: 'Right-click empty Desktop space → New Folder → name it Projects.',
    xp: 10,
    check: (vfs) => {
      const desktop = vfs.getChildren(vfs.getDesktopId());
      return desktop.some((n) => n.type === 'folder' && n.name === 'Projects');
    },
  },
  {
    id: 5,
    title: 'Move my-notes.txt into Projects',
    description: 'Cut my-notes.txt and paste it inside the Projects folder.',
    hint: 'Right-click my-notes.txt → Cut. Open Projects, right-click empty space → Paste.',
    xp: 15,
    check: (vfs) => {
      const projectsId = vfs.findProjectsId();
      if (!projectsId) return false;
      return vfs.getChildren(projectsId).some((n) => n.type === 'file' && n.name === 'my-notes.txt');
    },
  },
  {
    id: 6,
    title: 'Copy a file',
    description: 'Copy any file and paste the duplicate somewhere.',
    hint: 'Right-click a file → Copy, then right-click empty space → Paste.',
    xp: 10,
    check: (vfs) => vfs.getCopyCount() > 0,
  },
  {
    id: 7,
    title: 'Delete a file',
    description: 'Delete any file. It should go to the Trash.',
    hint: 'Select a file and press Delete, or right-click → Delete.',
    xp: 10,
    check: (vfs) => {
      return vfs.getChildren(vfs.getTrashId()).length > 0;
    },
  },
  {
    id: 8,
    title: 'Restore a file from Trash',
    description: 'Open the Trash, right-click a deleted file, and restore it.',
    hint: 'Open Files, go to Trash, right-click a file → Restore.',
    xp: 15,
    check: (vfs) => {
      return vfs.getRestoreCount() > 0;
    },
  },
  {
    id: 9,
    title: 'Create a ZIP from a file',
    description: 'Right-click any file and choose "Compress to ZIP".',
    hint: 'Right-click a file (e.g. a .txt) and select "Compress to ZIP".',
    xp: 15,
    check: (vfs) => {
      const allParents = [vfs.getDesktopId(), 'documents', 'downloads', 'projects'];
      for (const p of allParents) {
        const children = vfs.getChildren(p);
        if (children.some((n) => n.type === 'file' && n.name.endsWith('.zip'))) return true;
      }
      // Also check Desktop/Projects if user-created
      const projectsId = vfs.findProjectsId();
      if (projectsId && projectsId !== 'projects') {
        if (vfs.getChildren(projectsId).some((n) => n.type === 'file' && n.name.endsWith('.zip'))) return true;
      }
      return false;
    },
  },
  {
    id: 10,
    title: 'Extract a ZIP',
    description: 'Right-click a .zip file and choose "Extract Here".',
    hint: 'Find the .zip file you created, right-click it, and select "Extract Here".',
    xp: 15,
    check: (vfs) => vfs.getExtractCount() > 0,
  },
  {
    id: 11,
    title: 'Create the Website structure',
    description: 'Create a folder "Website" on the Desktop. Inside it, create three subfolders: html, css, js.',
    hint: 'Create Website on the Desktop, open it, then create html, css, and js folders inside.',
    xp: 20,
    check: (vfs) => {
      const desktop = vfs.getChildren(vfs.getDesktopId());
      const website = desktop.find((n) => n.type === 'folder' && n.name === 'Website');
      if (!website) return false;
      const children = vfs.getChildren(website.id);
      return (
        children.some((n) => n.type === 'folder' && n.name === 'html') &&
        children.some((n) => n.type === 'folder' && n.name === 'css') &&
        children.some((n) => n.type === 'folder' && n.name === 'js')
      );
    },
  },
  {
    id: 12,
    title: 'Create index.html inside html',
    description: 'Inside the Website/html folder, create a file named index.html.',
    hint: 'Open Website → html, right-click empty space → New File, name it index.html',
    xp: 20,
    check: (vfs) => {
      const desktop = vfs.getChildren(vfs.getDesktopId());
      const website = desktop.find((n) => n.type === 'folder' && n.name === 'Website');
      if (!website) return false;
      const htmlFolder = vfs.getChildren(website.id).find((n) => n.type === 'folder' && n.name === 'html');
      if (!htmlFolder) return false;
      return vfs.getChildren(htmlFolder.id).some((n) => n.type === 'file' && n.name === 'index.html');
    },
  },
];
