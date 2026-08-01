import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-800/60 relative overflow-hidden",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 dark:before:via-white/5 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-4 sm:p-5 flex flex-col justify-between h-[340px] sm:h-[380px] shadow-xs">
      <div>
        <Skeleton className="w-full h-44 sm:h-52 rounded-2xl mb-4" />
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="w-20 h-4 rounded-full" />
          <Skeleton className="w-16 h-4 rounded-full" />
        </div>
        <Skeleton className="w-3/4 h-6 rounded-lg mb-2" />
        <Skeleton className="w-full h-4 rounded-md" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 mt-auto">
        <Skeleton className="w-24 h-4 rounded-md" />
        <Skeleton className="w-8 h-8 rounded-xl" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6, type = 'card' }: { count?: number; type?: 'card' | 'member' | 'list' }) {
  return (
    <div className={cn(
      type === 'member' 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        : type === 'list'
        ? "flex flex-col gap-3"
        : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
    )}>
      {Array.from({ length: count }).map((_, i) => (
        type === 'member' ? (
          <MemberCardSkeleton key={i} />
        ) : type === 'list' ? (
          <ListItemSkeleton key={i} />
        ) : (
          <CardSkeleton key={i} />
        )
      ))}
    </div>
  );
}

export function MemberCardSkeleton() {
  return (
    <div className="rounded-3xl p-6 sm:p-8 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between h-[240px] relative overflow-hidden">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-12 h-12 rounded-full shrink-0" />
          <div className="space-y-2 flex-grow">
            <Skeleton className="w-3/4 h-5 rounded-lg" />
            <Skeleton className="w-1/2 h-3 rounded-md" />
          </div>
        </div>
        <Skeleton className="w-full h-4 rounded-md mb-2" />
        <Skeleton className="w-2/3 h-4 rounded-md" />
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
        <Skeleton className="w-16 h-6 rounded-full" />
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 min-w-0 flex-grow">
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        <div className="space-y-2 min-w-0 flex-grow">
          <Skeleton className="w-1/3 h-5 rounded-md" />
          <Skeleton className="w-1/2 h-3.5 rounded-md" />
        </div>
      </div>
      <Skeleton className="w-24 h-8 rounded-xl shrink-0" />
    </div>
  );
}

export function TableRowsSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn("h-5 rounded-md", c === 0 ? "w-1/4" : c === cols - 1 ? "w-16" : "w-1/6")} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <Skeleton className="w-full h-64 sm:h-96 rounded-3xl" />
      <div className="space-y-4">
        <Skeleton className="w-1/4 h-6 rounded-full" />
        <Skeleton className="w-3/4 h-10 rounded-2xl" />
        <div className="flex items-center gap-4">
          <Skeleton className="w-32 h-5 rounded-md" />
          <Skeleton className="w-24 h-5 rounded-md" />
        </div>
      </div>
      <div className="space-y-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <Skeleton className="w-full h-5 rounded-md" />
        <Skeleton className="w-full h-5 rounded-md" />
        <Skeleton className="w-4/5 h-5 rounded-md" />
        <Skeleton className="w-2/3 h-5 rounded-md" />
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 space-y-4">
          <Skeleton className="w-full h-60 rounded-2xl" />
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="w-28 h-4 rounded-md" />
                <Skeleton className="w-16 h-3 rounded-md" />
              </div>
            </div>
            <Skeleton className="w-12 h-6 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
