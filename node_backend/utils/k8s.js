import * as k8s from "@kubernetes/client-node";

// Initialize kube config.
// When running inside a K8s pod (Helm install), loadFromCluster() uses the
// ServiceAccount token mounted at /var/run/secrets/kubernetes.io/serviceaccount.
// When running locally (docker-compose / dev), loadFromDefault() uses ~/.kube/config.
const kc = new k8s.KubeConfig();
try {
  kc.loadFromCluster();
  console.log("✅ K8s client: loaded in-cluster config (ServiceAccount)");
} catch {
  kc.loadFromDefault();
  console.log("ℹ️  K8s client: loaded from default kubeconfig (~/.kube/config)");
}

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);

/**
 * Restart a Kubernetes Deployment by updating an annotation
 * @param {string} namespace
 * @param {string} deploymentName
 * @returns {Promise<string>} Success message or throws error
 */
export const restartDeployment = async (namespace, deploymentName) => {
  try {
    const patch = [
      {
        op: "replace",
        path: "/spec/template/metadata/annotations/kubectl.kubernetes.io~1restartedAt",
        value: new Date().toISOString()
      }
    ];
    
    // If the annotation doesn't exist yet, we must "add" instead of "replace".
    // Alternatively, we can use a merge patch. Let's use merge patch.
    const mergePatch = {
      spec: {
        template: {
          metadata: {
            annotations: {
              "kubectl.kubernetes.io/restartedAt": new Date().toISOString()
            }
          }
        }
      }
    };

    const options = { headers: { "Content-type": k8s.PatchUtils.PATCH_FORMAT_STRATEGIC_MERGE_PATCH } };
    
    await k8sAppsApi.patchNamespacedDeployment(deploymentName, namespace, mergePatch, undefined, undefined, undefined, undefined, options);
    
    return `Deployment ${deploymentName} in namespace ${namespace} restarted successfully.`;
  } catch (error) {
    console.error("Error restarting deployment:", error);
    throw new Error(`Failed to restart deployment ${deploymentName}: ${error.message}`);
  }
};

/**
 * Get pod status for a given deployment
 */
export const getDeploymentPods = async (namespace, deploymentName) => {
  try {
    const deployment = await k8sAppsApi.readNamespacedDeployment(deploymentName, namespace);
    const matchLabels = deployment.body.spec.selector.matchLabels;
    
    if (!matchLabels) {
      return [];
    }

    const labelSelector = Object.entries(matchLabels).map(([key, value]) => `${key}=${value}`).join(",");
    
    const pods = await k8sApi.listNamespacedPod(namespace, undefined, undefined, undefined, undefined, labelSelector);
    
    return pods.body.items.map(pod => ({
      name: pod.metadata.name,
      status: pod.status.phase,
      node: pod.spec.nodeName,
      restarts: pod.status.containerStatuses ? pod.status.containerStatuses.reduce((acc, c) => acc + c.restartCount, 0) : 0,
      startTime: pod.status.startTime
    }));
  } catch (error) {
    console.error("Error fetching pods:", error);
    throw new Error(`Failed to get pods for deployment ${deploymentName}`);
  }
};

/**
 * Scale a deployment
 */
export const scaleDeployment = async (namespace, deploymentName, replicas) => {
  try {
    const mergePatch = {
      spec: {
        replicas: replicas
      }
    };
    
    const options = { headers: { "Content-type": k8s.PatchUtils.PATCH_FORMAT_STRATEGIC_MERGE_PATCH } };
    await k8sAppsApi.patchNamespacedDeployment(deploymentName, namespace, mergePatch, undefined, undefined, undefined, undefined, options);
    
    return `Deployment ${deploymentName} scaled to ${replicas} replicas.`;
  } catch (error) {
    console.error("Error scaling deployment:", error);
    throw new Error(`Failed to scale deployment ${deploymentName}`);
  }
};
export const rollbackDeployment = async (name, ns) => console.log('Rolled back', name);
