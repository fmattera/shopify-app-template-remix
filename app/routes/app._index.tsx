import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Icon,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(
      `mutation scriptTagCreate($input: ScriptTagInput!) {
        scriptTagCreate(input: $input) {
          scriptTag {
            id
            src
            displayScope
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          input: {
            src: "https://python-ads.onrender.com/loader-peninsula.js",
            displayScope: "ONLINE_STORE",
          },
        },
      }
    );

    const data = await response.json();
    // console.log("Script tag creation response:", data);

    if (data.data.scriptTagCreate.userErrors.length > 0) {
      console.error("GraphQL errors:", data.data.scriptTagCreate.userErrors);
      throw new Error(data.data.scriptTagCreate.userErrors[0].message);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to create script tag:", error);
    return { success: false };
  }
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const [message, setMessage] = useState<string | null>(null);
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  const injectScript = () => {
    fetcher.submit({}, { method: "POST" });
  };

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        setMessage("The script has been injected successfully.");
      } else {
        setMessage("Failed to inject the script.");
      }
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <Page>
      <TitleBar title="ROASt it - Integrate your store with AI" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Step 1: Give read-only access
                </Text>
                <Text as="p" variant="bodyMd">
                  Email: <strong>mattera.ita@gmail.com</strong>
                </Text>
                <Text as="p" variant="bodyMd">
                  This will allow ROASt it to scrape your Google Ads keywords and train our AI on them.
                </Text>
              </BlockStack>
            </Card>
 
            <div style={{ height: "20px" }} />

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Step 2: Attach ROASt it to your store
                </Text>
                <InlineStack gap="300">
                  <Button loading={isLoading} onClick={injectScript}>
                    Inject Script
                  </Button>
                </InlineStack>
                {message && (
                  <InlineStack gap="300">
                    {fetcher.data?.success && <span role="img" aria-label="success">✅</span>}
                    <Text as="p" variant="bodyMd">
                      {message}
                    </Text>
                  </InlineStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}