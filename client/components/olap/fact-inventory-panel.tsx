import { FactPanelBase } from './fact-panel-base'

type FactInventoryPanelProps = React.ComponentProps<typeof FactPanelBase>

export function FactInventoryPanel(props: FactInventoryPanelProps) {
  return <FactPanelBase {...props} />
}
