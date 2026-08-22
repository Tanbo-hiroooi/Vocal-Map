import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function PracticeRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/songs/${id}/map`} />;
}
