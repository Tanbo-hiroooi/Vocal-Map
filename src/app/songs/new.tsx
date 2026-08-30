import { Screen } from '@/components/common/Screen';
import { useAppData } from '@/features/app/AppProvider';
import { SongForm } from '@/features/songs/SongForm';
import { useRouter } from 'expo-router';
import React from 'react';
export default function NewSongScreen(){const {saveSong}=useAppData();const router=useRouter();return <Screen scroll={false}><SongForm onSave={async(song)=>{await saveSong(song);router.replace(`/songs/${song.id}/map`)}}/></Screen>}
