import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import FailingOpenScreen from './screens/FailingOpenScreen';
import SensitiveErrorScreen from './screens/SensitiveErrorScreen';
import MissingParamScreen from './screens/MissingParamScreen';
import DosScreen from './screens/DosScreen';

const IS_FIXED = true;

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#eee',
          tabBarStyle: { backgroundColor: '#1a1a2e', borderTopColor: '#333' },
          tabBarActiveTintColor: '#4a90e2',
          tabBarInactiveTintColor: '#666',
        }}
      >
        <Tab.Screen
          name="Auth"
          options={{ title: '🔓 Auth', tabBarLabel: () => <Text style={{ color: '#e74c3c', fontSize: 10 }}>Auth</Text> }}
        >
          {() => <FailingOpenScreen isFixed={IS_FIXED} />}
        </Tab.Screen>
        <Tab.Screen
          name="Error"
          options={{ title: '⚠️ Error', tabBarLabel: () => <Text style={{ color: '#e67e22', fontSize: 10 }}>Error</Text> }}
        >
          {() => <SensitiveErrorScreen isFixed={IS_FIXED} />}
        </Tab.Screen>
        <Tab.Screen
          name="Param"
          options={{ title: '❓ Param', tabBarLabel: () => <Text style={{ color: '#8e44ad', fontSize: 10 }}>Param</Text> }}
        >
          {() => <MissingParamScreen isFixed={IS_FIXED} />}
        </Tab.Screen>
        <Tab.Screen
          name="DoS"
          options={{ title: '💥 DoS', tabBarLabel: () => <Text style={{ color: '#27ae60', fontSize: 10 }}>DoS</Text> }}
        >
          {() => <DosScreen isFixed={IS_FIXED} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
