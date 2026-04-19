import { FactPanelBase } from './fact-panel-base'

type FactSalesPanelProps = React.ComponentProps<typeof FactPanelBase>

export function FactSalesPanel(props: FactSalesPanelProps) {
  return <FactPanelBase {...props} />
}
