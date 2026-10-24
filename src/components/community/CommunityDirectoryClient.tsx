'use client';

import React, { useState } from 'react';
import {
  Search,
  Users,
  Building2,
  Lock,
  Phone,
  Briefcase,
  MessageSquare,
  Star,
  Eye,
  Layers,
} from 'lucide-react';
import type { CommunityGroup, DirectoryMember, PostItem } from '@/lib/types/domain';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { DetailModal } from '@/components/ui/DetailModal';

interface CommunityDirectoryClientProps {
  actorId: string;
  totalSocietyMembers: number;
  directory: DirectoryMember[];
  posts: PostItem[];
  groups: CommunityGroup[];
}

const MEMBERS_PER_PAGE = 4;
const POSTS_PER_PAGE = 3;

export function CommunityDirectoryClient({
  totalSocietyMembers,
  directory,
  posts,
  groups,
}: CommunityDirectoryClientProps) {
  const [activeTab, setActiveTab] = useState<'directory' | 'feed' | 'groups'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('all');

  // Pagination state
  const [memberPage, setMemberPage] = useState(1);
  const [postPage, setPostPage] = useState(1);

  // Click-for-Details Modal state
  const [selectedMember, setSelectedMember] = useState<DirectoryMember | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);

  const buildings = Array.from(
    new Set(directory.map((m) => m.building_name).filter(Boolean))
  ) as string[];

  const filteredMembers = directory.filter((m) => {
    const matchesBuilding = buildingFilter === 'all' || m.building_name === buildingFilter;
    if (!matchesBuilding) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.display_name.toLowerCase().includes(q) ||
      (m.profession ?? '').toLowerCase().includes(q) ||
      (m.skills ?? []).some((s: string) => s.toLowerCase().includes(q)) ||
      (m.business_name ?? '').toLowerCase().includes(q)
    );
  });

  const pagedMembers = filteredMembers.slice(
    (memberPage - 1) * MEMBERS_PER_PAGE,
    memberPage * MEMBERS_PER_PAGE
  );

  const pagedPosts = posts.slice(
    (postPage - 1) * POSTS_PER_PAGE,
    postPage * POSTS_PER_PAGE
  );

  return (
    <div className="space-y-5">
      {/* Compact Header & Tab Switcher */}
      <div className="rounded-[16px] bg-white border border-[#E8E8EC] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[22px] sm:text-[26px] font-display font-bold tracking-[-0.03em] text-[#0A0A0A]">
            Directory & Community Feed
          </h1>
          <p className="text-[13px] text-[#6B6B6B]">
            {totalSocietyMembers.toLocaleString()} verified members • Private-by-default directory.
            Click any card for details.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-[#FAFAFA] p-1 rounded-[10px] border border-[#E8E8EC]">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-[#0EA5E9] text-white shadow-2xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Directory ({filteredMembers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
              activeTab === 'feed'
                ? 'bg-[#6366F1] text-white shadow-2xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discussions ({posts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('groups')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition cursor-pointer ${
              activeTab === 'groups'
                ? 'bg-[#10B981] text-white shadow-2xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Groups ({groups.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MEMBER DIRECTORY (Concise Cards + Pagination + Click for Profile Modal) */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Search & Tower Filter */}
          <div className="bg-white border border-[#E8E8EC] rounded-[14px] p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9C9C9C] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setMemberPage(1);
                }}
                placeholder="Search by name, profession, skill, or business..."
                className="w-full pl-10 pr-4 py-2 rounded-[8px] border border-[#E8E8EC] text-[14px]"
              />
            </div>
            <select
              value={buildingFilter}
              onChange={(e) => {
                setBuildingFilter(e.target.value);
                setMemberPage(1);
              }}
              aria-label="Filter by Tower"
              className="rounded-[8px] border border-[#E8E8EC] px-3.5 py-2 text-[14px] bg-white"
            >
              <option value="all">All Towers</option>
              {buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Concise Member Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pagedMembers.map((member) => {
              const initials = member.display_name
                .split(' ')
                .map((n: string) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <article
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className="bg-white border border-[#E8E8EC] hover:border-[#0EA5E9] rounded-[14px] p-4 flex items-center justify-between gap-4 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#6366F1] text-white font-display font-bold text-sm flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-display font-bold text-[15px] text-[#0A0A0A] truncate">
                          {member.display_name}
                        </h2>
                        {member.building_code && (
                          <span className="px-2 py-0.5 rounded-full bg-[#0EA5E9]/10 text-[#0284C7] text-[10px] font-medium shrink-0">
                            {member.building_code}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-[#6366F1] font-medium truncate">
                        {member.profession ?? 'Verified Resident Member'}
                      </p>
                      <p className="text-[12px] text-[#6B6B6B] truncate mt-0.5">
                        {member.unit_number ? `Flat ${member.unit_number}` : 'Unit Private'} •{' '}
                        {member.personal_phone ?? 'Phone Private'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMember(member);
                    }}
                    className="shrink-0 h-[34px] px-3 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#0EA5E9] text-[#0A0A0A] text-[12px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    <span>Profile</span>
                  </button>
                </article>
              );
            })}
          </div>

          <div className="bg-white border border-[#E8E8EC] rounded-[14px] px-4 pb-3">
            <PaginationBar
              currentPage={memberPage}
              totalItems={filteredMembers.length}
              pageSize={MEMBERS_PER_PAGE}
              onPageChange={setMemberPage}
              itemLabel="members"
            />
          </div>
        </div>
      )}

      {/* TAB 2: COMMUNITY DISCUSSIONS (Concise Cards + Pagination + Click for Details) */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {pagedPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="bg-white border border-[#E8E8EC] hover:border-[#6366F1] rounded-[14px] p-4 flex items-center justify-between gap-4 transition cursor-pointer"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] text-[11px] font-medium capitalize">
                      {post.category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[12px] text-[#6B6B6B]">
                      by {post.author_name} ({post.building_name ?? 'Resident'})
                    </span>
                  </div>
                  <h3 className="text-[15px] font-display font-bold text-[#0A0A0A] truncate">
                    {post.title}
                  </h3>
                  <p className="text-[13px] text-[#6B6B6B] line-clamp-1">{post.body}</p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPost(post);
                  }}
                  className="shrink-0 h-[34px] px-3 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] hover:border-[#6366F1] text-[12px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#6366F1]" />
                  <span>Read ({post.comments?.length ?? 0})</span>
                </button>
              </article>
            ))}
          </div>

          <div className="bg-white border border-[#E8E8EC] rounded-[14px] px-4 pb-3">
            <PaginationBar
              currentPage={postPage}
              totalItems={posts.length}
              pageSize={POSTS_PER_PAGE}
              onPageChange={setPostPage}
              itemLabel="discussions"
            />
          </div>
        </div>
      )}

      {/* TAB 3: SOCIETY GROUPS */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((grp) => (
            <div
              key={grp.id}
              className="bg-white border border-[#E8E8EC] rounded-[14px] p-4 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/10 text-[#059669] text-[11px] font-medium capitalize">
                  {grp.group_type} Group
                </span>
                {grp.building_name && (
                  <span className="text-[11px] text-[#6B6B6B]">{grp.building_name}</span>
                )}
              </div>
              <h3 className="font-display font-bold text-[15px] text-[#0A0A0A]">{grp.name}</h3>
              <p className="text-[12px] text-[#6B6B6B]">{grp.moderation_policy}</p>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Member Profile Details */}
      <DetailModal
        open={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        title={selectedMember?.display_name ?? ''}
        subtitle={
          selectedMember?.professional_headline ??
          selectedMember?.profession ??
          'Verified Resident Member'
        }
        badge={
          selectedMember && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#0EA5E9]/10 text-[#0284C7] text-[11px] font-medium">
              {selectedMember.building_name ?? 'Society Member'}
            </span>
          )
        }
      >
        {selectedMember && (
          <div className="space-y-4">
            {selectedMember.bio && (
              <p className="text-[14px] text-[#0A0A0A] leading-relaxed">{selectedMember.bio}</p>
            )}

            {selectedMember.member_rating_avg && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F59E0B]/15 text-[#D97706] text-[12px] font-medium">
                <Star className="w-3.5 h-3.5 fill-[#F59E0B]" />
                <span>
                  {selectedMember.member_rating_avg} Rating ({selectedMember.member_review_count}{' '}
                  reviews • {selectedMember.completed_interactions_count} exchanges)
                </span>
              </div>
            )}

            {selectedMember.skills && selectedMember.skills.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[12px] font-medium text-[#6B6B6B]">Skills & Interests</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMember.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-full bg-[#6366F1]/10 text-[#6366F1] text-[11px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedMember.business_name && (
              <div className="p-3 rounded-[10px] bg-[#10B981]/5 border border-[#10B981]/25 space-y-1 text-[12px]">
                <div className="font-semibold text-[#0A0A0A] flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>{selectedMember.business_name}</span>
                </div>
                {selectedMember.business_description && (
                  <p className="text-[#6B6B6B]">{selectedMember.business_description}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-[10px] bg-[#FAFAFA] border border-[#E8E8EC] text-[12px]">
              <div>
                <span className="text-[#6B6B6B] block">Flat / Unit</span>
                <strong className="text-[#0A0A0A] inline-flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-[#6B6B6B]" />
                  {selectedMember.unit_number
                    ? `Flat ${selectedMember.unit_number}`
                    : 'Private (Opt-in Only)'}
                </strong>
              </div>
              <div>
                <span className="text-[#6B6B6B] block">Phone Contact</span>
                <strong className="text-[#0A0A0A] inline-flex items-center gap-1 mt-0.5">
                  {selectedMember.personal_phone ? (
                    <>
                      <Phone className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>{selectedMember.personal_phone}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>Private (Opt-in Only)</span>
                    </>
                  )}
                </strong>
              </div>
            </div>
          </div>
        )}
      </DetailModal>

      {/* MODAL 2: Community Post Detail */}
      <DetailModal
        open={Boolean(selectedPost)}
        onClose={() => setSelectedPost(null)}
        title={selectedPost?.title ?? ''}
        subtitle={
          selectedPost
            ? `Posted by ${selectedPost.author_name} (${selectedPost.building_name ?? 'Resident'})`
            : undefined
        }
        badge={
          selectedPost && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] text-[11px] font-medium capitalize">
              {selectedPost.category.replace(/_/g, ' ')}
            </span>
          )
        }
      >
        {selectedPost && (
          <div className="space-y-4">
            <p className="text-[14px] text-[#0A0A0A] leading-relaxed">{selectedPost.body}</p>
            {selectedPost.comments && selectedPost.comments.length > 0 && (
              <div className="pt-3 border-t border-[#E8E8EC] space-y-2">
                <div className="text-[12px] font-bold text-[#0A0A0A]">
                  Comments ({selectedPost.comments.length})
                </div>
                {selectedPost.comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] text-[12px]"
                  >
                    <strong>{c.author_name}: </strong>
                    <span className="text-[#6B6B6B]">{c.body}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DetailModal>
    </div>
  );
}
