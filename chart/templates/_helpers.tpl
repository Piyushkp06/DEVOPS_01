{{/*
Expand the name of the chart.
*/}}
{{- define "devops.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Fullname — used as a prefix for all resources.
*/}}
{{- define "devops.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s" $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Common labels applied to every resource.
*/}}
{{- define "devops.labels" -}}
helm.sh/chart: {{ include "devops.name" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/part-of: devops-ai-platform
{{- end }}

{{/*
Selector labels for a component.
Usage: {{ include "devops.selectorLabels" (dict "component" "node-backend") }}
*/}}
{{- define "devops.selectorLabels" -}}
app: {{ .component }}
{{- end }}

{{/*
Namespace helper — always resolves to .Values.namespace.
*/}}
{{- define "devops.namespace" -}}
{{ .Values.namespace }}
{{- end }}

{{/*
Database URL constructed from postgres values.
*/}}
{{- define "devops.databaseUrl" -}}
postgresql://{{ .Values.postgres.user }}:{{ .Values.postgres.password }}@postgres-service.{{ include "devops.namespace" . }}.svc.cluster.local:5432/{{ .Values.postgres.database }}?schema=public
{{- end }}
