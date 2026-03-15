import { useEffect } from "react";
import { View } from "react-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";

export default function Auth0Redirect() {
  const router = useRouter();

  useEffect(() => {
    async function handle() {
      const url = await Linking.getInitialURL();
      console.log("Auth redirect:", url);

      // let the Auth0 SDK finish resolving authorize()
      setTimeout(() => {
        router.replace("/");
      }, 100);
    }

    handle();
  }, []);

  return <View />;
}