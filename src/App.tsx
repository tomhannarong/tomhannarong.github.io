import {
  ArrowRight,
  Code2,
  ExternalLink,
  Github,
  Globe2,
  Layers3,
  Loader2,
  Search,
  Sparkles,
  Star,
  UserRound,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

type GitHubRepo = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  fork: boolean;
  archived: boolean;
  has_pages?: boolean;
  topics?: string[];
};

type ProjectKind = 'Featured' | 'Website' | 'Tool' | 'Code' | 'Archive';

type Destination = {
  title: string;
  description: string;
  href: string;
  sourceHref: string;
  kind: ProjectKind;
  status: 'Live' | 'Profile' | 'Repo' | 'Coming soon';
};

const USERNAME = 'tomhannarong';
const SITE_ORIGIN = 'https://tomhannarong.github.io';
const PROFILE_URL = 'https://github.com/tomhannarong';
const REPOS_API = `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`;
const manualLiveRoutes: Record<string, string> = {
  'tomhannarong.github.io': SITE_ORIGIN,
  'pechaburi-trip': `${SITE_ORIGIN}/pechaburi-trip/`,
};
const featuredRepoNames = new Set(Object.keys(manualLiveRoutes));

const featuredDestinations: Destination[] = [
  {
    title: 'Pechaburi Trip',
    description: 'A live travel project and the first destination launched from this portal.',
    href: `${SITE_ORIGIN}/pechaburi-trip/`,
    sourceHref: 'https://github.com/tomhannarong/pechaburi-trip',
    kind: 'Website',
    status: 'Live',
  },
  {
    title: 'My Profile',
    description: 'A future personal profile space for experience, focus areas, and links.',
    href: PROFILE_URL,
    sourceHref: PROFILE_URL,
    kind: 'Featured',
    status: 'Profile',
  },
  {
    title: 'GitHub Projects',
    description: 'Browse source repositories, experiments, services, and public work.',
    href: PROFILE_URL,
    sourceHref: PROFILE_URL,
    kind: 'Code',
    status: 'Repo',
  },
];

const categoryOptions: Array<ProjectKind | 'All'> = ['All', 'Featured', 'Website', 'Tool', 'Code', 'Archive'];
const sortOptions = [
  { label: 'Recently updated', value: 'updated' },
  { label: 'Most starred', value: 'stars' },
  { label: 'Name', value: 'name' },
] as const;

function normalizeUrl(url: string | null) {
  if (!url) {
    return '';
  }
  return url.startsWith('http') ? url : `https://${url}`;
}

function canInferPagesUrl(repo: GitHubRepo) {
  const pageLikeTopics = ['website', 'portfolio', 'demo', 'pages', 'vite', 'react', 'travel'];

  return Boolean(
    repo.has_pages ||
      repo.topics?.some((topic) => pageLikeTopics.includes(topic.toLowerCase())),
  );
}

function getLiveUrl(repo: GitHubRepo) {
  const homepage = normalizeUrl(repo.homepage);
  if (homepage) {
    return homepage;
  }
  if (manualLiveRoutes[repo.name]) {
    return manualLiveRoutes[repo.name];
  }
  if (canInferPagesUrl(repo)) {
    return `${SITE_ORIGIN}/${repo.name}/`;
  }
  return '';
}

function getKind(repo: GitHubRepo): ProjectKind {
  if (repo.archived) {
    return 'Archive';
  }
  if (repo.name === `${USERNAME}.github.io` || repo.name === 'pechaburi-trip' || getLiveUrl(repo)) {
    return 'Website';
  }
  if (/api|service|docker|auth|bot|tool/i.test(repo.name)) {
    return 'Tool';
  }
  return 'Code';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function languageColor(language: string | null) {
  const colors: Record<string, string> = {
    HTML: 'bg-orange-400',
    CSS: 'bg-sky-400',
    JavaScript: 'bg-amber-300',
    TypeScript: 'bg-cyan-300',
    Dockerfile: 'bg-blue-400',
    Python: 'bg-emerald-300',
  };

  return colors[language ?? ''] ?? 'bg-zinc-400';
}

function App() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ProjectKind | 'All'>('All');
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]['value']>('updated');

  useEffect(() => {
    const controller = new AbortController();

    async function loadRepos() {
      try {
        setIsLoading(true);
        setError('');
        const response = await fetch(REPOS_API, {
          headers: { Accept: 'application/vnd.github+json' },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`GitHub API returned ${response.status}`);
        }

        const data = (await response.json()) as GitHubRepo[];
        setRepos(data);
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === 'AbortError') {
          return;
        }
        setError('Could not load GitHub projects right now. Source links are still available.');
      } finally {
        setIsLoading(false);
      }
    }

    loadRepos();
    return () => controller.abort();
  }, []);

  const filteredRepos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return repos
      .filter((repo) => {
        const kind = getKind(repo);
        const matchesCategory =
          category === 'All' ||
          category === kind ||
          (category === 'Featured' && featuredRepoNames.has(repo.name));
        const matchesQuery =
          !normalizedQuery ||
          repo.name.toLowerCase().includes(normalizedQuery) ||
          repo.description?.toLowerCase().includes(normalizedQuery) ||
          repo.language?.toLowerCase().includes(normalizedQuery);

        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'stars') {
          return b.stargazers_count - a.stargazers_count;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [category, query, repos, sortBy]);

  const liveCount = repos.filter((repo) => getLiveUrl(repo)).length;
  const languageCount = new Set(repos.map((repo) => repo.language).filter(Boolean)).size;

  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.16),transparent_28%,rgba(16,185,129,0.1)_58%,transparent_78%),linear-gradient(180deg,rgba(39,39,42,0.35),transparent_42%),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:auto,auto,72px_72px,72px_72px]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <a href={SITE_ORIGIN} className="flex items-center gap-3" aria-label="Open home portal">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
              <Layers3 size={20} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white">tomhannarong.github.io</span>
              <span className="block text-xs text-zinc-400">Project portal</span>
            </span>
          </a>
          <a
            href={PROFILE_URL}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/70 px-3 text-sm font-medium text-zinc-100 transition hover:border-cyan-300 hover:text-cyan-100"
          >
            <Github size={16} />
            GitHub
          </a>
        </header>

        <section className="grid min-h-[72vh] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-sm font-medium text-emerald-100">
              <Sparkles size={16} />
              Gateway to live projects, demos, and source code
            </span>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-white sm:text-6xl lg:text-7xl">
              One clean doorway into every project.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              This portal is the front door for live pages like Pechaburi Trip, future profile
              pages, experiments, services, and public repositories by tomhannarong.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`${SITE_ORIGIN}/pechaburi-trip/`}
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-cyan-300 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
              >
                Open Pechaburi Trip
                <ArrowRight size={17} />
              </a>
              <a
                href="#projects"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/70 px-5 text-sm font-semibold text-white transition hover:border-emerald-300"
              >
                Browse Projects
              </a>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <StatCard label="Public repos" value={isLoading ? '...' : String(repos.length || 22)} />
            <StatCard label="Live routes" value={isLoading ? '...' : `${liveCount || 2}+`} />
            <StatCard label="Languages" value={isLoading ? '...' : String(languageCount || 4)} />
          </div>
        </section>

        <section aria-labelledby="featured-title" className="scroll-mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-200">Featured</p>
              <h2 id="featured-title" className="mt-2 text-3xl font-semibold text-white">
                Destinations
              </h2>
            </div>
            <span className="hidden text-sm text-zinc-400 sm:inline">Live links first, source always nearby</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featuredDestinations.map((destination) => (
              <DestinationCard key={destination.title} destination={destination} />
            ))}
          </div>
        </section>

        <section id="projects" aria-labelledby="projects-title" className="scroll-mt-8 pb-14">
          <div className="mb-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-200">All projects</p>
              <h2 id="projects-title" className="mt-2 text-3xl font-semibold text-white">
                Public GitHub work
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_160px] lg:w-[520px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search projects"
                  className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900/80 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-300"
                />
              </label>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
                className="h-11 rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 text-sm text-white outline-none transition focus:border-cyan-300"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {categoryOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCategory(option)}
                className={`h-10 shrink-0 rounded-lg border px-4 text-sm font-medium transition ${
                  category === option
                    ? 'border-cyan-300 bg-cyan-300 text-zinc-950'
                    : 'border-zinc-700 bg-zinc-900/70 text-zinc-300 hover:border-emerald-300 hover:text-white'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {isLoading && (
            <StatePanel
              icon={<Loader2 className="animate-spin" size={22} />}
              title="Loading public projects"
              description="Fetching the latest repositories from GitHub."
            />
          )}

          {error && !isLoading && (
            <StatePanel icon={<Github size={22} />} title="GitHub data is unavailable" description={error} />
          )}

          {!isLoading && !error && filteredRepos.length === 0 && (
            <StatePanel
              icon={<Search size={22} />}
              title="No projects match this view"
              description="Try another category or search term."
            />
          )}

          {!isLoading && !error && filteredRepos.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredRepos.map((repo) => (
                <RepoCard key={repo.full_name} repo={repo} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/75 p-5 shadow-2xl shadow-zinc-950/30">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <article className="flex min-h-[240px] flex-col rounded-lg border border-zinc-800 bg-zinc-900/80 p-5 shadow-2xl shadow-zinc-950/20">
      <div className="mb-5 flex items-start justify-between gap-3">
        <Badge label={destination.status} />
        {destination.kind === 'Featured' ? <UserRound className="text-emerald-200" /> : <Globe2 className="text-cyan-200" />}
      </div>
      <h3 className="text-2xl font-semibold text-white">{destination.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-zinc-400">{destination.description}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <a
          href={destination.href}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
        >
          Open
          <ExternalLink size={15} />
        </a>
        <a
          href={destination.sourceHref}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 px-3 text-sm font-semibold text-zinc-200 transition hover:border-emerald-300"
        >
          Source
        </a>
      </div>
    </article>
  );
}

function RepoCard({ repo }: { repo: GitHubRepo }) {
  const liveUrl = getLiveUrl(repo);
  const kind = getKind(repo);
  const description = repo.description || 'Public project ready to explore from the source repository.';

  return (
    <article className="flex min-h-[260px] flex-col rounded-lg border border-zinc-800 bg-zinc-900/75 p-5 transition hover:-translate-y-1 hover:border-cyan-300/70">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge label={liveUrl ? 'Live' : kind} />
            {repo.fork && <Badge label="Fork" variant="muted" />}
            {repo.archived && <Badge label="Archive" variant="muted" />}
          </div>
          <h3 className="break-words text-xl font-semibold text-white">{repo.name}</h3>
        </div>
        <Code2 className="shrink-0 text-zinc-500" />
      </div>
      <p className="line-clamp-3 flex-1 text-sm leading-6 text-zinc-400">{description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${languageColor(repo.language)}`} />
          {repo.language || 'Code'}
        </span>
        <span className="inline-flex items-center gap-1">
          <Star size={14} />
          {repo.stargazers_count}
        </span>
        <span>Updated {formatDate(repo.updated_at)}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {liveUrl && (
          <a
            href={liveUrl}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-300 px-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
          >
            Open Project
            <ExternalLink size={15} />
          </a>
        )}
        <a
          href={repo.html_url}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 px-3 text-sm font-semibold text-zinc-200 transition hover:border-emerald-300"
        >
          View Source
          <Github size={15} />
        </a>
      </div>
    </article>
  );
}

function Badge({ label, variant = 'default' }: { label: string; variant?: 'default' | 'muted' }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-md px-2 text-xs font-semibold ${
        variant === 'muted' ? 'bg-zinc-800 text-zinc-300' : 'bg-emerald-300/15 text-emerald-100'
      }`}
    >
      {label}
    </span>
  );
}

function StatePanel({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="grid min-h-[260px] place-items-center rounded-lg border border-zinc-800 bg-zinc-900/75 p-8 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-zinc-800 text-cyan-200">{icon}</div>
        <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">{description}</p>
      </div>
    </div>
  );
}

export default App;
