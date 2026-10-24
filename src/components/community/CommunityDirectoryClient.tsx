'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Building2,
  Briefcase,
  Store,
  ShieldCheck,
  MessageSquare,
  Users,
  Star,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import type { CommunityGroup, DirectoryMember, PostItem } from '@/lib/types/domain';

interface CommunityDirectoryClientProps {
  actorId: string;
  totalSocietyMembers: number;
  directory: DirectoryMember[];
  posts: PostItem[];
  groups: CommunityGroup[];
}

export function CommunityDirectoryClient({
  actorId,
  totalSocietyMembers,
  directory,
  posts,
  groups,
}: CommunityDirectoryClientProps) {
  const [activeTab, setActiveTab] = useState<'directory' | 'businesses' | 'feed' | 'groups'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('all');

  const filteredDirectory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return directory.filter((m) => {
      if (buildingFilter !== 'all' && m.building_code !== buildingFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        m.display_name,
        m.profession,
        m.bio,
        m.professional_headline,
        m.business_name,
        m.business_category,
        ...(m.skills ?? []),
        ...(m.interests ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [directory, searchQuery, buildingFilter]);

  const businessMembers = useMemo(
    () => directory.filter((m) => Boolean(m.business_name || m.professional_headline)),
    [directory]
  );

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation Tabs */}
      <div className="rounded-2xl bg-white border border-[#E8E8EC] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0EA5E9]/10 text-[#0EA5E9]">
              Community Network
            </span>
            <h1 className="text-2xl font-display font-bold text-[#0A0A0A] mt-1">
              Directory, Professions & Discussions
            </h1>
            <p className="text-sm text-[#6B6B6B] mt-0.5">
              Connect with verified neighbours, discover resident businesses, and join building discussions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E8E8EC]">
          {[
            { id: 'directory', label: `Member & Skill Directory (${directory.length} Sampled)`, icon: Users },
            { id: 'businesses', label: `Professions & Member Businesses (${businessMembers.length})`, icon: Briefcase },
            { id: 'feed', label: `Discussion Feed (${posts.length})`, icon: MessageSquare },
            { id: 'groups', label: `Building & Interest Circles (${groups.length})`, icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'bg-[#6366F1] text-white'
                    : 'bg-[#FAFAFA] text-[#0A0A0A] border border-[#E8E8EC] hover:bg-[#FAFAFA]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Search & Tower Filter Bar */}
          <div className="rounded-2xl bg-white border border-[#E8E8EC] p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, profession (e.g. Architect, Paediatrician, Lawyer), skill, or interest..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E8E8EC] text-sm bg-[#FAFAFA]"
                aria-label="Search Community Directory"
              />
            </div>

            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              aria-label="Filter by Building"
              className="rounded-xl border border-[#E8E8EC] px-3.5 py-2 text-sm bg-[#FAFAFA] font-medium"
            >
              <option value="all">All 6 Towers (A–F)</option>
              <option value="TWR-A">Tower A — Gulmohar</option>
              <option value="TWR-B">Tower B — Amaltas</option>
              <option value="TWR-C">Tower C — Banyan</option>
              <option value="TWR-D">Tower D — Ashoka</option>
              <option value="TWR-E">Tower E — Peepal</option>
              <option value="TWR-F">Tower F — Deodar</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDirectory.map((member) => {
              const isSelf = member.id === actorId;
              return (
                <article
                  key={member.id}
                  className="rounded-2xl bg-white border border-[#E8E8EC] p-5 flex flex-col justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-bold text-base text-[#0A0A0A]">{member.display_name}</h2>
                          {isSelf && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-[#6366F1] text-[10px] font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-[#6366F1]">
                          {member.profession ?? 'Community Member'}
                        </p>
                      </div>

                      {member.member_rating_avg && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAFAFA] border border-[#E8E8EC] text-xs font-bold tabular-nums">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{Number(member.member_rating_avg).toFixed(2)}</span>
                          <span className="text-[#6B6B6B] font-normal">({member.member_review_count})</span>
                        </div>
                      )}
                    </div>

                    {member.role_badges && member.role_badges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {member.role_badges.map((badge) => (
                          <span
                            key={badge}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-900 text-indigo-300 text-[11px] font-semibold"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}

                    {member.bio && <p className="text-xs text-[#6B6B6B] leading-relaxed">{member.bio}</p>}

                    {member.skills && member.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {member.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-md bg-[#FAFAFA] text-[#0A0A0A] text-[11px] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Server-Enforced Contact & Unit Privacy Strip (MEM-03 / Test 3) */}
                  <div className="pt-3 border-t border-[#E8E8EC] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-[#6B6B6B]">
                      <Building2 className="w-3.5 h-3.5 text-[#6366F1]" />
                      <span>{member.building_name ?? 'Tower Hidden'}</span>
                      {member.unit_number ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          Flat {member.unit_number}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          <Lock className="w-3 h-3" />
                          Flat Private
                        </span>
                      )}
                    </div>

                    <div>
                      {member.personal_phone ? (
                        <span className="font-semibold text-[#6366F1] tabular-nums">{member.personal_phone}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <Lock className="w-3 h-3" />
                          Phone Stripped by Server (In-App Chat Only)
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'businesses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {businessMembers.map((bm) => (
            <article
              key={bm.id}
              className="rounded-2xl bg-white border border-[#E8E8EC] p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-[#6366F1] text-[11px] font-bold uppercase">
                    {bm.business_category ?? 'Professional Consultation'}
                  </span>
                  <h2 className="text-base font-bold text-[#0A0A0A] mt-1">
                    {bm.business_name ?? bm.professional_headline}
                  </h2>
                  <p className="text-xs text-[#6B6B6B]">
                    Led by <strong>{bm.display_name}</strong> ({bm.profession}) • {bm.building_name}
                  </p>
                </div>
                <Store className="w-5 h-5 text-[#6366F1] shrink-0" />
              </div>
              {bm.business_description && (
                <p className="text-xs text-[#6B6B6B] leading-relaxed">{bm.business_description}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {(bm.skills ?? []).map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-[#FAFAFA] border border-[#E8E8EC] text-[11px]">
                    {s}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {activeTab === 'feed' && (
        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl bg-white border border-[#E8E8EC] p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-[#6366F1] border border-indigo-200 text-xs font-bold uppercase">
                  {post.category.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-[#6B6B6B]">
                  {post.building_name ?? 'All Towers'} • {new Date(post.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>
              <h2 className="text-base font-bold text-[#0A0A0A]">{post.title}</h2>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">{post.body}</p>
              <div className="text-xs text-[#0A0A0A] font-medium">
                Posted by {post.author_name} ({post.author_profession})
              </div>

              {post.comments && post.comments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#E8E8EC] space-y-2">
                  <div className="text-xs font-bold text-[#6B6B6B]">
                    Neighbour Replies ({post.comments.length})
                  </div>
                  {post.comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-[#FAFAFA] text-xs space-y-1">
                      <div className="font-bold text-[#0A0A0A]">{c.author_name}</div>
                      <p className="text-[#6B6B6B]">{c.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((grp) => (
            <article
              key={grp.id}
              className="rounded-2xl bg-white border border-[#E8E8EC] p-5 space-y-2"
            >
              <span className="px-2 py-0.5 rounded bg-[#FAFAFA] text-xs font-bold uppercase text-[#6366F1]">
                {grp.group_type} Circle
              </span>
              <h2 className="text-base font-bold text-[#0A0A0A]">{grp.name}</h2>
              <p className="text-xs text-[#6B6B6B]">{grp.moderation_policy}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
