'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flagsService, CreateFlagDto, UpdateFlagDto } from '../infrastructure/api/flags.service';

export const useFlags = () => {
  return useQuery({
    queryKey: ['flags'],
    queryFn: flagsService.getFlags,
  });
};

export const useFlag = (key: string) => {
  return useQuery({
    queryKey: ['flags', key],
    queryFn: () => flagsService.getFlag(key),
    enabled: !!key,
  });
};

export const useCreateFlag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFlagDto) => flagsService.createFlag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags'] });
    },
  });
};

export const useUpdateFlag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: UpdateFlagDto }) =>
      flagsService.updateFlag(key, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flags'] });
      queryClient.invalidateQueries({ queryKey: ['flags', data.key] });
    },
  });
};

export const useToggleFlag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      flagsService.updateFlag(key, { enabled }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flags'] });
      queryClient.invalidateQueries({ queryKey: ['flags', data.key] });
    },
  });
};

export const useDeleteFlag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => flagsService.deleteFlag(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags'] });
    },
  });
};
