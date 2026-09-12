import type { SkillNode } from '../types';

// 50+ common tech skills with parent/child relationships and aliases
export const SKILL_TAXONOMY: SkillNode[] = [
  // Languages
  { id: 'python', label: 'Python', category: 'Languages', aliases: ['python3', 'py'] },
  { id: 'javascript', label: 'JavaScript', category: 'Languages', aliases: ['js', 'ecmascript', 'vanilla js'] },
  { id: 'typescript', label: 'TypeScript', category: 'Languages', aliases: ['ts'], parent: 'javascript' },
  { id: 'java', label: 'Java', category: 'Languages', aliases: ['jvm'] },
  { id: 'csharp', label: 'C#', category: 'Languages', aliases: ['c-sharp', 'c sharp', '.net', 'dotnet', 'csharp'] },
  { id: 'cpp', label: 'C++', category: 'Languages', aliases: ['cpp', 'c plus plus'] },
  { id: 'go', label: 'Go', category: 'Languages', aliases: ['golang'] },
  { id: 'rust', label: 'Rust', category: 'Languages', aliases: ['rustlang'] },
  { id: 'php', label: 'PHP', category: 'Languages', aliases: ['php7', 'php8'] },
  { id: 'ruby', label: 'Ruby', category: 'Languages', aliases: ['ruby on rails', 'ror'] },
  { id: 'kotlin', label: 'Kotlin', category: 'Languages', aliases: ['kotlinlang'] },
  { id: 'swift', label: 'Swift', category: 'Languages', aliases: ['swiftlang'] },
  { id: 'scala', label: 'Scala', category: 'Languages', aliases: [] },

  // Backend
  { id: 'nodejs', label: 'Node.js', category: 'Backend', aliases: ['node', 'node.js', 'node js'] },
  { id: 'express', label: 'Express', category: 'Backend', aliases: ['expressjs', 'express.js'], parent: 'nodejs' },
  { id: 'flask', label: 'Flask', category: 'Backend', aliases: ['flask python'], parent: 'python' },
  { id: 'django', label: 'Django', category: 'Backend', aliases: ['django python', 'django rest framework', 'drf'], parent: 'python' },
  { id: 'spring', label: 'Spring Boot', category: 'Backend', aliases: ['spring boot', 'spring framework', 'springboot'], parent: 'java' },
  { id: 'rails', label: 'Ruby on Rails', category: 'Backend', aliases: ['rails', 'ror'], parent: 'ruby' },
  { id: 'laravel', label: 'Laravel', category: 'Backend', aliases: [], parent: 'php' },
  { id: 'fastapi', label: 'FastAPI', category: 'Backend', aliases: ['fast api', 'fast-api'], parent: 'python' },
  { id: 'graphql', label: 'GraphQL', category: 'Backend', aliases: ['gql', 'apollo graphql'] },
  { id: 'rest', label: 'REST APIs', category: 'Backend', aliases: ['restful', 'rest api', 'restful api', 'api design'] },

  // Frontend
  { id: 'react', label: 'React', category: 'Frontend', aliases: ['reactjs', 'react.js', 'react js'] },
  { id: 'vue', label: 'Vue', category: 'Frontend', aliases: ['vuejs', 'vue.js', 'vue js', 'vue3'] },
  { id: 'angular', label: 'Angular', category: 'Frontend', aliases: ['angularjs', 'angular.js', 'angular 2'] },
  { id: 'html', label: 'HTML/CSS', category: 'Frontend', aliases: ['html5', 'css3', 'html', 'css', 'sass', 'scss', 'less'] },
  { id: 'tailwind', label: 'Tailwind CSS', category: 'Frontend', aliases: ['tailwindcss', 'tailwind css'], parent: 'html' },
  { id: 'redux', label: 'Redux', category: 'Frontend', aliases: ['redux toolkit'], parent: 'react' },
  { id: 'nextjs', label: 'Next.js', category: 'Frontend', aliases: ['next js', 'nextjs', 'next.js'], parent: 'react' },
  { id: 'svelte', label: 'Svelte', category: 'Frontend', aliases: ['sveltekit', 'svelte kit'] },

  // Database
  { id: 'sql', label: 'SQL', category: 'Database', aliases: ['structured query language'] },
  { id: 'mysql', label: 'MySQL', category: 'Database', aliases: ['my sql'], parent: 'sql' },
  { id: 'postgresql', label: 'PostgreSQL', category: 'Database', aliases: ['postgres', 'pg', 'psql'], parent: 'sql' },
  { id: 'sqlite', label: 'SQLite', category: 'Database', aliases: ['sqlite3'], parent: 'sql' },
  { id: 'mongodb', label: 'MongoDB', category: 'Database', aliases: ['mongo', 'mongoose'] },
  { id: 'redis', label: 'Redis', category: 'Database', aliases: ['redis cache', 'elasti-cache'] },
  { id: 'dynamodb', label: 'DynamoDB', category: 'Database', aliases: ['dynamo db', 'dynamo'] },
  { id: 'elasticsearch', label: 'Elasticsearch', category: 'Database', aliases: ['elastic search', 'elastic', 'kibana', ' elk'] },

  // Cloud
  { id: 'aws', label: 'AWS', category: 'Cloud', aliases: ['amazon web services', 'ec2', 's3', 'lambda aws', 'amazon aws'] },
  { id: 'gcp', label: 'Google Cloud', category: 'Cloud', aliases: ['gcp', 'google cloud platform', 'gke'] },
  { id: 'azure', label: 'Azure', category: 'Cloud', aliases: ['microsoft azure', 'azure cloud'] },
  { id: 'docker', label: 'Docker', category: 'DevOps', aliases: ['docker containers', 'dockerize', 'containerization'] },
  { id: 'kubernetes', label: 'Kubernetes', category: 'DevOps', aliases: ['k8s', 'kubernetes cluster', 'helm'] },
  { id: 'terraform', label: 'Terraform', category: 'DevOps', aliases: ['iac', 'infrastructure as code'] },

  // DevOps / Tools
  { id: 'cicd', label: 'CI/CD', category: 'DevOps', aliases: ['ci/cd', 'ci cd', 'continuous integration', 'continuous deployment', 'jenkins', 'github actions', 'gitlab ci', 'circleci'] },
  { id: 'git', label: 'Git', category: 'Tools', aliases: ['github', 'gitlab', 'version control', 'bitbucket'] },
  { id: 'jira', label: 'Jira', category: 'Tools', aliases: ['atlassian jira', 'agile jira'] },
  { id: 'nginx', label: 'Nginx', category: 'DevOps', aliases: ['reverse proxy nginx'] },
  { id: 'linux', label: 'Linux', category: 'DevOps', aliases: ['unix', 'bash', 'shell scripting', 'shell script'] },

  // Data
  { id: 'pandas', label: 'Pandas', category: 'Data', aliases: ['pandas python'], parent: 'python' },
  { id: 'numpy', label: 'NumPy', category: 'Data', aliases: ['numpy python'], parent: 'python' },
  { id: 'tensorflow', label: 'TensorFlow', category: 'Data', aliases: ['tensor flow', 'tf'] },
  { id: 'pytorch', label: 'PyTorch', category: 'Data', aliases: ['py torch', 'torch'] },
  { id: 'spark', label: 'Apache Spark', category: 'Data', aliases: ['pyspark', 'spark sql'] },
  { id: 'tableau', label: 'Tableau', category: 'Data', aliases: ['tableau dashboard'] },
  { id: 'etl', label: 'ETL', category: 'Data', aliases: ['extract transform load', 'data pipeline', 'data pipelines'] },
  { id: 'ml', label: 'Machine Learning', category: 'Data', aliases: ['machine learning', 'ml models', 'deep learning', 'neural networks', 'nlp', 'natural language processing'] },

  // Mobile
  { id: 'ios', label: 'iOS Development', category: 'Mobile', aliases: ['ios dev', 'iphone development', 'uikit', 'swiftui'], parent: 'swift' },
  { id: 'android', label: 'Android Development', category: 'Mobile', aliases: ['android dev', 'android sdk', 'jetpack compose'], parent: 'kotlin' },
  { id: 'react-native', label: 'React Native', category: 'Mobile', aliases: ['reactnative', 'react native'], parent: 'react' },

  // Soft Skills
  { id: 'agile', label: 'Agile/Scrum', category: 'Soft Skills', aliases: ['scrum', 'agile methodology', 'sprint planning'] },
  { id: 'leadership', label: 'Leadership', category: 'Soft Skills', aliases: ['team lead', 'tech lead', 'mentoring', 'mentorship'] },
  { id: 'communication', label: 'Communication', category: 'Soft Skills', aliases: ['stakeholder management', 'cross-functional'] },
  { id: 'testing', label: 'Testing', category: 'Tools', aliases: ['unit testing', 'test-driven development', 'tdd', 'jest', 'mocha', 'pytest', 'junit', 'selenium', 'cypress'] },
];

// Build a lookup map
export const SKILL_MAP: Record<string, SkillNode> = SKILL_TAXONOMY.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<string, SkillNode>
);

// Build alias -> skillId map (lowercased)
export const ALIAS_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const skill of SKILL_TAXONOMY) {
    map[skill.label.toLowerCase()] = skill.id;
    for (const alias of skill.aliases) {
      map[alias.toLowerCase()] = skill.id;
    }
  }
  return map;
})();

export function getSkillById(id: string): SkillNode | undefined {
  return SKILL_MAP[id];
}

export function getParent(id: string): SkillNode | undefined {
  const node = SKILL_MAP[id];
  if (!node?.parent) return undefined;
  return SKILL_MAP[node.parent];
}

export function getChildren(id: string): SkillNode[] {
  return SKILL_TAXONOMY.filter((s) => s.parent === id);
}

export function getRelatedSkills(id: string): string[] {
  const node = SKILL_MAP[id];
  if (!node) return [];
  const related = new Set<string>();
  if (node.parent) related.add(node.parent);
  for (const child of getChildren(id)) {
    related.add(child.id);
  }
  if (node.related) {
    for (const r of node.related) related.add(r);
  }
  return Array.from(related);
}

// Traverse the graph up to find all ancestors
export function getAncestors(id: string): string[] {
  const ancestors: string[] = [];
  let current = SKILL_MAP[id];
  while (current?.parent) {
    ancestors.push(current.parent);
    current = SKILL_MAP[current.parent];
  }
  return ancestors;
}

// Traverse the graph down to find all descendants
export function getDescendants(id: string): string[] {
  const descendants: string[] = [];
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = getChildren(current);
    for (const child of children) {
      descendants.push(child.id);
      queue.push(child.id);
    }
  }
  return descendants;
}

export const CATEGORIES = [
  'Backend',
  'Frontend',
  'Database',
  'DevOps',
  'Tools',
  'Languages',
  'Cloud',
  'Data',
  'Mobile',
  'Soft Skills',
] as const;
