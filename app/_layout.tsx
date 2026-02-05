import React from 'react'
import { Text, View } from 'react-native'
import "../global.css"

export default function RootLayout() {
  return (
    <View className='flex items-center justify-center h-[100vh]'>
      <Text className='text-2xl text-red-500'>RootLayout</Text>
    </View>
  )
}
