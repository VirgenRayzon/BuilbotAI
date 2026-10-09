export const BUILD_ADVISOR_GOALS = {
  Gaming: {
    label: 'Gaming priority',
    options: [
      { value: '4k-quality', label: '4K visual quality', prompt: '4K gaming with high visual settings; prioritize GPU performance and adequate VRAM over maximum competitive frame rate.' },
      { value: 'high-fps', label: 'High FPS / competitive', prompt: 'High frame rates and low latency in competitive games at 1080p or 1440p; balance a strong gaming CPU with the GPU.' },
      { value: '1440p-balanced', label: 'Balanced 1440p gaming', prompt: 'Balanced 1440p gaming with strong frame rates and visual quality; avoid overspending on either CPU or GPU.' },
      { value: '1080p-value', label: '1080p on a budget', prompt: 'Good-value 1080p gaming; prioritize the best practical gaming performance within the stated budget.' },
    ],
  },
  'Video Editing': {
    label: 'Editing workload',
    options: [
      { value: '1080p-editing', label: '1080p editing', prompt: 'Smooth 1080p video editing and exports; prioritize a balanced CPU, enough RAM, and fast storage.' },
      { value: '4k-editing', label: '4K editing', prompt: 'Smooth 4K timeline playback and exports; prioritize CPU performance, sufficient RAM, fast storage, and useful GPU acceleration.' },
      { value: 'effects-color', label: 'Effects & color grading', prompt: 'Video editing with effects and color grading; prioritize GPU acceleration and VRAM alongside CPU, RAM, and fast scratch storage.' },
    ],
  },
  'Software Development': {
    label: 'Development workload',
    options: [
      { value: 'web-apps', label: 'Web & app development', prompt: 'Web and application development with IDEs, browsers, and local builds; prioritize responsive CPU performance, RAM, and fast storage.' },
      { value: 'containers', label: 'Containers & large projects', prompt: 'Large codebases, local builds, virtual machines, and multiple containers; prioritize CPU cores, RAM capacity, and fast storage over gaming GPU performance.' },
      { value: 'local-ai', label: 'Local AI development', prompt: 'Local AI and machine-learning development; prioritize GPU compatibility and VRAM, with enough system RAM and storage for models and datasets.' },
    ],
  },
  'General Office Work': {
    label: 'Office workload',
    options: [
      { value: 'daily-office', label: 'Daily tasks & video calls', prompt: 'Documents, email, browsing, and video calls; prioritize reliability, responsiveness, and value over a discrete gaming GPU.' },
      { value: 'multitasking', label: 'Heavy multitasking', prompt: 'Many browser tabs, large spreadsheets, and several office apps at once; prioritize RAM capacity, responsive CPU performance, and fast storage.' },
      { value: 'quiet-compact', label: 'Quiet, compact setup', prompt: 'Office work in a quiet, space-saving PC; prioritize low noise, efficient parts, and a compact compatible case.' },
    ],
  },
} as const;

export type BuildAdvisorIntendedUse = keyof typeof BUILD_ADVISOR_GOALS;

export function getBuildAdvisorGoal(use: string, value: string) {
  const group = BUILD_ADVISOR_GOALS[use as BuildAdvisorIntendedUse];
  return group?.options.find(option => option.value === value);
}
