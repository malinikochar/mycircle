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
  MapPin,
} from 'lucide-react';
import type { CommunityGroup, DirectoryMember, PostItem } from '@/lib/types/domain';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { DetailModal } from '@/components/ui/DetailModal';
import { MemberAvatar } from '@/components/ui/MemberAvatar';

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
    <div className="space-y-6">
      {/* Spacious Apple-style Header & Tab Switcher */}
      <div className="rounded-[24px] bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 flex flex-wrap items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[11px] font-semibold">
            <MapPin className="w-3.5 h-3.5" />
            <span>Bugis Residences @ Victoria • Verified Member Circle</span>
          </div>
          <h1 className="text-[24px] sm:text-[28px] font-display font-bold tracking-[-0.03em] text-[#1D1D1F]">
            Directory & Community Feed
          </h1>
          <p className="text-[13px] text-[#6E6E73]">
            {totalSocietyMembers.toLocaleString()} verified members • Private-by-default directory with verified portraits.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-[#F5F5F7] p-1.5 rounded-full border border-black/[0.05]">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-[#0071E3] text-white shadow-xs'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Directory ({filteredMembers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition cursor-pointer ${
              activeTab === 'feed'
                ? 'bg-[#6366F1] text-white shadow-xs'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discussions ({posts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('groups')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition cursor-pointer ${
              activeTab === 'groups'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Groups ({groups.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MEMBER DIRECTORY (Spacious Cards + Studio Portraits + Pagination) */}
      {activeTab === 'directory' && (
        <div className="space-y-5">
          {/* Search & Tower Filter */}
          <div className="bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.02)] rounded-[22px] p-5 flex flex-col sm:flex-row gap-3.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#86868B] absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setMemberPage(1);
                }}
                placeholder="Search by name, profession, skill, or business..."
                className="w-full pl-11 pr-4 py-2.5 rounded-full border border-black/[0.1] text-[14px]"
              />
            </div>
            <select
              value={buildingFilter}
              onChange={(e) => {
                setBuildingFilter(e.target.value);
                setMemberPage(1);
              }}
              aria-label="Filter by Tower"
              className="rounded-full border border-black/[0.1] px-4 py-2.5 text-[14px] bg-white"
            >
              <option value="all">All Towers</option>
              {buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Spacious Member Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pagedMembers.map((member) => (
              <article
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="bg-white border border-black/[0.06] hover:border-[#0071E3]/40 rounded-[22px] p-6 flex items-center justify-between gap-4 transition cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <MemberAvatar
                    name={member.display_name}
                    avatarUrl={member.avatar_url}
                    size="lg"
                    ring
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display font-bold text-[16px] text-[#1D1D1F] truncate">
                        {member.display_name}
                      </h2>
                      {member.building_code && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[10px] font-semibold shrink-0">
                          {member.building_code}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-[#0071E3] font-medium truncate">
                      {member.profession ?? 'Verified Resident Member'}
                    </p>
                    <p className="text-[12px] text-[#6E6E73] truncate">
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
                  className="shrink-0 h-[38px] px-4 rounded-full bg-[#F5F5F7] hover:bg-[#0071E3] hover:text-white text-[#1D1D1F] text-[12px] font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Profile</span>
                </button>
              </article>
            ))}
          </div>

          <div className="bg-white border border-black/[0.06] rounded-[22px] px-6 py-2">
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

      {/* TAB 2: COMMUNITY DISCUSSIONS (Spacious Cards + Author Avatars + Short Titles) */}
      {activeTab === 'feed' && (
        <div className="space-y-5">
          <div className="space-y-4">
            {pagedPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="bg-white border border-black/[0.06] hover:border-[#0071E3]/40 rounded-[22px] p-6 flex items-center justify-between gap-5 transition cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <MemberAvatar name={post.author_name} size="md" />
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[11px] font-semibold capitalize">
                        {post.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[12px] text-[#6E6E73]">
                        by <strong className="text-[#1D1D1F]">{post.author_name}</strong> ({post.building_name ?? 'Resident'})
                      </span>
                    </div>
                    <h3 className="text-[16px] font-display font-bold text-[#1D1D1F] truncate">
                      {post.title}
                    </h3>
                    <p className="text-[13px] text-[#6E6E73] leading-relaxed line-clamp-1">
                      {post.body}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPost(post);
                  }}
                  className="shrink-0 h-[38px] px-4 rounded-full bg-[#F5F5F7] hover:bg-[#0071E3] hover:text-white text-[#1D1D1F] text-[12px] font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Read ({post.comments?.length ?? 0})</span>
                </button>
              </article>
            ))}
          </div>

          <div className="bg-white border border-black/[0.06] rounded-[22px] px-6 py-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {groups.map((grp) => (
            <div
              key={grp.id}
              className="bg-white border border-black/[0.06] rounded-[22px] p-6 space-y-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#10B981]/10 text-[#059669] text-[11px] font-semibold capitalize">
                  {grp.group_type} Group
                </span>
                {grp.building_name && (
                  <span className="text-[12px] text-[#6E6E73] font-medium">{grp.building_name}</span>
                )}
              </div>
              <h3 className="font-display font-bold text-[16px] text-[#1D1D1F]">{grp.name}</h3>
              <p className="text-[13px] text-[#6E6E73] leading-relaxed">{grp.moderation_policy}</p>
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
            <span className="px-2.5 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[11px] font-semibold">
              {selectedMember.building_name ?? 'Society Member'}
            </span>
          )
        }
      >
        {selectedMember && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-[18px] bg-[#F5F5F7] border border-black/[0.05]">
              <MemberAvatar
                name={selectedMember.display_name}
                avatarUrl={selectedMember.avatar_url}
                size="xl"
                ring
              />
              <div className="space-y-1">
                <div className="font-display font-bold text-[17px] text-[#1D1D1F]">
                  {selectedMember.display_name}
                </div>
                <div className="text-[13px] text-[#0071E3] font-medium">
                  {selectedMember.profession ?? 'Verified Resident'}
                </div>
                {selectedMember.member_rating_avg && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#D97706] text-[11px] font-semibold">
                    <Star className="w-3 h-3 fill-[#F59E0B]" />
                    <span>
                      {selectedMember.member_rating_avg} Rating ({selectedMember.member_review_count}{' '}
                      reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {selectedMember.bio && (
              <p className="text-[14px] text-[#1D1D1F] leading-relaxed">{selectedMember.bio}</p>
            )}

            {selectedMember.skills && selectedMember.skills.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[12px] font-semibold text-[#6E6E73]">Skills & Interests</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMember.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[11px] font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedMember.business_name && (
              <div className="p-4 rounded-[14px] bg-[#10B981]/5 border border-[#10B981]/25 space-y-1 text-[12px]">
                <div className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>{selectedMember.business_name}</span>
                </div>
                {selectedMember.business_description && (
                  <p className="text-[#6E6E73]">{selectedMember.business_description}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 p-4 rounded-[14px] bg-[#F5F5F7] border border-black/[0.06] text-[12px]">
              <div>
                <span className="text-[#6E6E73] block">Flat / Unit</span>
                <strong className="text-[#1D1D1F] inline-flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-[#6E6E73]" />
                  {selectedMember.unit_number
                    ? `Flat ${selectedMember.unit_number}`
                    : 'Private (Opt-in Only)'}
                </strong>
              </div>
              <div>
                <span className="text-[#6E6E73] block">Phone Contact</span>
                <strong className="text-[#1D1D1F] inline-flex items-center gap-1 mt-0.5">
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
            <span className="px-2.5 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[11px] font-semibold capitalize">
              {selectedPost.category.replace(/_/g, ' ')}
            </span>
          )
        }
      >
        {selectedPost && (
          <div className="space-y-4">
            <p className="text-[14px] text-[#1D1D1F] leading-relaxed">{selectedPost.body}</p>
            {selectedPost.comments && selectedPost.comments.length > 0 && (
              <div className="pt-3 border-t border-black/[0.06] space-y-2.5">
                <div className="text-[12px] font-bold text-[#1D1D1F]">
                  Comments ({selectedPost.comments.length})
                </div>
                {selectedPost.comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-[12px] bg-[#F5F5F7] border border-black/[0.05] text-[12px] flex items-start gap-2.5"
                  >
                    <MemberAvatar name={c.author_name} size="xs" />
                    <div>
                      <strong className="text-[#1D1D1F]">{c.author_name}: </strong>
                      <span className="text-[#6E6E73]">{c.body}</span>
                    </div>
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
